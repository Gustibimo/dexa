import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';

export enum AttendanceStatus {
  MASUK = 'masuk',
  PULANG = 'pulang',
}

@Entity('attendances')
@Index(['employee_id', 'date'])
export class Attendance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  employee_id: number;

  @Column({ type: 'date', nullable: false })
  date: string;

  @Column({ type: 'timestamp', nullable: true })
  clock_in: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  clock_out: Date | null;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    nullable: false,
  })
  status: AttendanceStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;
}
