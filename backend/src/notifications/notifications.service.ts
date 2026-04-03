import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Subject, Observable } from 'rxjs';
import { KafkaConsumerService } from '../kafka/kafka-consumer.service';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Employee } from '../employees/entities/employee.entity';

/** Work schedule: clock-in expected by 09:00, work day ends at 18:00 */
const WORK_START_HOUR = 9;
const WORK_START_MINUTE = 0;
const LATE_THRESHOLD_MINUTES = 15; // 09:15 = late
const EARLY_LEAVE_HOUR = 15; // before 15:00 = early leave

export interface NotificationEvent {
  data: string;
}

type NotificationSeverity = 'high' | 'medium' | 'low';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly notifications$ = new Subject<MessageEvent>();

  constructor(
    private readonly kafkaConsumerService: KafkaConsumerService,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const consumer = await this.kafkaConsumerService.createConsumer(
        'notification-consumer-group',
      );

      await this.kafkaConsumerService.subscribe(
        consumer,
        'profile-changes',
        (message) => this.handleProfileChange(message),
      );

      const consumer2 = await this.kafkaConsumerService.createConsumer(
        'notification-consumer-group-attendance',
      );

      await this.kafkaConsumerService.subscribe(
        consumer2,
        'attendance-events',
        (message) => this.handleAttendanceEvent(message),
      );

      this.logger.log(
        'Notification consumer subscribed to profile-changes and attendance-events.',
      );
    } catch (err) {
      this.logger.error(
        'Failed to initialize notification consumer',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  /** Profile changes are always relevant for HR admin */
  private handleProfileChange(message: Record<string, unknown>): void {
    this.pushNotification({
      type: 'profile_updated',
      severity: 'medium',
      entity: message.entity,
      entityId: message.entityId,
      employeeId: message.employeeId,
      employeeName: message.employeeName,
      changes: message.changes,
      timestamp: message.timestamp || new Date().toISOString(),
    });
  }

  /** Only notify admin for actionable attendance events (late, early leave) */
  private handleAttendanceEvent(message: Record<string, unknown>): void {
    const type = message.type as string;
    const timestamp = (message.timestamp as string) || new Date().toISOString();
    const clockTime = new Date(timestamp);
    const hours = clockTime.getHours();
    const minutes = clockTime.getMinutes();

    if (type === 'clock_in' || type === 'clock-in') {
      const lateThreshold =
        hours > WORK_START_HOUR ||
        (hours === WORK_START_HOUR && minutes > WORK_START_MINUTE + LATE_THRESHOLD_MINUTES);

      if (lateThreshold) {
        const clockTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        this.pushNotification({
          type: 'late_clock_in',
          severity: 'high',
          employeeId: message.employeeId,
          employeeName: message.employeeName,
          clockTime: clockTimeStr,
          timestamp,
        });
      }
      // On-time clock-in: no notification (only logged in audit)
      return;
    }

    if (type === 'clock_out' || type === 'clock-out') {
      if (hours < EARLY_LEAVE_HOUR) {
        const clockTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        this.pushNotification({
          type: 'early_leave',
          severity: 'high',
          employeeId: message.employeeId,
          employeeName: message.employeeName,
          clockTime: clockTimeStr,
          timestamp,
        });
      }
      // Normal clock-out: no notification
      return;
    }
  }

  /** Cron: every weekday at 10:00 — check who hasn't clocked in */
  @Cron('0 10 * * 1-5', { name: 'absent-check' })
  async checkAbsentEmployees(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    const activeEmployees = await this.employeeRepository.find({
      where: { is_active: true },
      select: ['id', 'name'],
    });

    const todayRecords = await this.attendanceRepository.find({
      where: { date: today },
      select: ['employee_id'],
    });

    const clockedInIds = new Set(todayRecords.map((r) => r.employee_id));

    const absent = activeEmployees.filter((e) => !clockedInIds.has(e.id));

    if (absent.length > 0) {
      this.pushNotification({
        type: 'absent_alert',
        severity: 'high',
        employees: absent.map((e) => ({ id: e.id, name: e.name })),
        count: absent.length,
        date: today,
        timestamp: new Date().toISOString(),
      });
      this.logger.log(`Absent alert: ${absent.length} employees not clocked in by 10:00`);
    }
  }

  /** Cron: every weekday at 19:00 — check who forgot to clock out */
  @Cron('0 19 * * 1-5', { name: 'forgot-clockout-check' })
  async checkForgotClockOut(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    const openRecords = await this.attendanceRepository.find({
      where: { date: today, clock_out: IsNull() },
      relations: ['employee'],
    });

    if (openRecords.length > 0) {
      const employees = openRecords.map((r) => ({
        id: r.employee_id,
        name: r.employee?.name || `Employee #${r.employee_id}`,
      }));

      // Deduplicate by employee id
      const uniqueMap = new Map(employees.map((e) => [e.id, e]));

      this.pushNotification({
        type: 'forgot_clock_out',
        severity: 'high',
        employees: Array.from(uniqueMap.values()),
        count: uniqueMap.size,
        date: today,
        timestamp: new Date().toISOString(),
      });
      this.logger.log(`Forgot clock-out alert: ${uniqueMap.size} employees`);
    }
  }

  private pushNotification(payload: Record<string, unknown>): void {
    const event = new MessageEvent('message', {
      data: JSON.stringify(payload),
    });

    this.notifications$.next(event);
  }

  getNotificationStream(): Observable<MessageEvent> {
    return this.notifications$.asObservable();
  }
}
