import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Employee } from './entities/employee.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { AdminUpdateEmployeeDto } from './dto/admin-update-employee.dto';
import { KafkaProducerService } from '../kafka/kafka-producer.service';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    private readonly kafkaProducerService: KafkaProducerService,
  ) {}

  async findById(id: number): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({ where: { id } });
    if (!employee) {
      throw new NotFoundException(`Employee with id ${id} not found`);
    }
    return employee;
  }

  async getProfile(id: number): Promise<Employee> {
    return this.findById(id);
  }

  async updateProfile(
    id: number,
    dto: UpdateProfileDto,
    photoFile?: Express.Multer.File,
  ): Promise<Employee> {
    const employee = await this.findById(id);
    const changes: string[] = [];

    if (dto.phone !== undefined && dto.phone !== employee.phone) {
      employee.phone = dto.phone;
      changes.push('phone');
    }

    if (dto.password) {
      const salt = await bcrypt.genSalt(10);
      employee.password = await bcrypt.hash(dto.password, salt);
      changes.push('password');
    }

    if (photoFile) {
      employee.photo_url = `/uploads/${photoFile.filename}`;
      changes.push('photo');
    }

    const updated = await this.employeeRepository.save(employee);

    if (changes.length > 0) {
      await this.kafkaProducerService.produce('profile-changes', {
        type: 'profile_updated',
        employeeId: employee.id,
        employeeName: employee.name,
        changes,
        timestamp: new Date().toISOString(),
      });
    }

    return updated;
  }

  async findAll(
    page: number,
    limit: number,
    search?: string,
  ): Promise<{
    data: Employee[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const where = search
      ? [{ name: ILike(`%${search}%`) }, { email: ILike(`%${search}%`) }]
      : undefined;

    const [data, total] = await this.employeeRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });

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

  async create(dto: CreateEmployeeDto): Promise<Employee> {
    const existing = await this.employeeRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const employee = this.employeeRepository.create({
      ...dto,
      password: hashedPassword,
    });

    return this.employeeRepository.save(employee);
  }

  async update(id: number, dto: AdminUpdateEmployeeDto): Promise<Employee> {
    const employee = await this.findById(id);
    Object.assign(employee, dto);
    return this.employeeRepository.save(employee);
  }

  async deactivate(id: number): Promise<Employee> {
    const employee = await this.findById(id);
    employee.is_active = false;
    return this.employeeRepository.save(employee);
  }

  async resetPassword(id: number, newPassword: string): Promise<void> {
    const employee = await this.findById(id);
    const salt = await bcrypt.genSalt(10);
    employee.password = await bcrypt.hash(newPassword, salt);
    await this.employeeRepository.save(employee);
  }
}
