import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
import { Attendance, AttendanceStatus } from './entities/attendance.entity';
import { KafkaProducerService } from '../kafka/kafka-producer.service';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    private readonly kafkaProducerService: KafkaProducerService,
  ) {}

  private getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  async clockIn(employeeId: number, employeeName: string): Promise<Attendance> {
    const today = this.getTodayDateString();

    const attendance = this.attendanceRepository.create({
      employee_id: employeeId,
      date: today,
      clock_in: new Date(),
      status: AttendanceStatus.MASUK,
    });

    const saved = await this.attendanceRepository.save(attendance);

    await this.kafkaProducerService.produce('attendance-events', {
      type: 'clock_in',
      employeeId,
      employeeName,
      date: today,
      timestamp: new Date().toISOString(),
    });

    return saved;
  }

  async clockOut(employeeId: number, employeeName: string): Promise<Attendance> {
    const today = this.getTodayDateString();

    const record = await this.attendanceRepository.findOne({
      where: { employee_id: employeeId, date: today, clock_out: IsNull() },
      order: { created_at: 'DESC' },
    });

    if (!record) {
      throw new BadRequestException('No active clock-in record found for today');
    }

    record.clock_out = new Date();
    record.status = AttendanceStatus.PULANG;

    const updated = await this.attendanceRepository.save(record);

    await this.kafkaProducerService.produce('attendance-events', {
      type: 'clock_out',
      employeeId,
      employeeName,
      date: today,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  async getToday(employeeId: number): Promise<Attendance[]> {
    const today = this.getTodayDateString();
    return this.attendanceRepository.find({
      where: { employee_id: employeeId, date: today },
      order: { created_at: 'ASC' },
    });
  }

  async getSummary(
    employeeId: number,
    from: string,
    to: string,
  ): Promise<{
    data: Attendance[];
    meta: { from: string; to: string; totalDays: number; totalPresent: number };
  }> {
    const data = await this.attendanceRepository.find({
      where: {
        employee_id: employeeId,
        date: Between(from, to),
      },
      order: { date: 'ASC' },
    });

    return {
      data,
      meta: {
        from,
        to,
        totalDays: new Set(data.map((a) => a.date)).size,
        totalPresent: new Set(
          data
            .filter((a) => a.status === AttendanceStatus.MASUK || a.status === AttendanceStatus.PULANG)
            .map((a) => a.date),
        ).size,
      },
    };
  }

  async findAll(filters: {
    page: number;
    limit: number;
    from?: string;
    to?: string;
    employee_id?: number;
  }): Promise<{
    data: Attendance[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { page, limit, from, to, employee_id } = filters;

    const qb = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.employee', 'employee')
      .orderBy('attendance.date', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (employee_id) {
      qb.andWhere('attendance.employee_id = :employee_id', { employee_id });
    }

    if (from) {
      qb.andWhere('attendance.date >= :from', { from });
    }

    if (to) {
      qb.andWhere('attendance.date <= :to', { to });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
