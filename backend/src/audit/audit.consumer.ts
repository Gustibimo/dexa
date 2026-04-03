import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KafkaConsumerService } from '../kafka/kafka-consumer.service';
import * as fs from 'fs';
import * as path from 'path';

interface AuditEntry {
  action: string;
  entity: string;
  entityId: number | string;
  employeeId: number | string;
  employeeName: string;
  changes: Record<string, unknown>;
  timestamp: string;
}

@Injectable()
export class AuditConsumer implements OnModuleInit {
  private readonly logger = new Logger(AuditConsumer.name);
  private readonly logFilePath: string;

  constructor(private readonly kafkaConsumerService: KafkaConsumerService) {
    this.logFilePath = path.join(process.cwd(), 'logs', 'audit.json');
  }

  async onModuleInit(): Promise<void> {
    try {
      const consumer = await this.kafkaConsumerService.createConsumer(
        'audit-consumer-group',
      );

      await this.kafkaConsumerService.subscribe(
        consumer,
        'profile-changes',
        (message) => this.handleMessage(message),
      );

      // Create a second consumer for the second topic since kafkajs
      // requires run() to be called once per consumer
      const consumer2 = await this.kafkaConsumerService.createConsumer(
        'audit-consumer-group-attendance',
      );

      await this.kafkaConsumerService.subscribe(
        consumer2,
        'attendance-events',
        (message) => this.handleMessage(message),
      );

      this.logger.log('Audit consumer subscribed to topics.');
    } catch (err) {
      this.logger.error(
        'Failed to initialize audit consumer',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  private handleMessage(message: Record<string, unknown>): void {
    const entry: AuditEntry = {
      action: (message.type as string) || 'unknown',
      entity: (message.entity as string) || this.inferEntity(message),
      entityId: (message.entityId as number | string) || (message.employeeId as number | string) || '',
      employeeId: (message.employeeId as number | string) || '',
      employeeName: (message.employeeName as string) || '',
      changes: (message.changes as Record<string, unknown>) || {},
      timestamp: (message.timestamp as string) || new Date().toISOString(),
    };

    this.appendAuditLog(entry);
  }

  private inferEntity(message: Record<string, unknown>): string {
    const type = (message.type as string) || '';
    if (type.startsWith('clock_') || type.startsWith('clock-')) return 'attendance';
    if (type.includes('profile')) return 'employee';
    return 'unknown';
  }

  private appendAuditLog(entry: AuditEntry): void {
    try {
      const dir = path.dirname(this.logFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      let logs: AuditEntry[] = [];
      if (fs.existsSync(this.logFilePath)) {
        const content = fs.readFileSync(this.logFilePath, 'utf-8');
        logs = JSON.parse(content);
      }

      logs.push(entry);
      fs.writeFileSync(this.logFilePath, JSON.stringify(logs, null, 2));
    } catch (err) {
      this.logger.error(
        'Failed to write audit log',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
