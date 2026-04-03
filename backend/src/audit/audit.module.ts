import { Module } from '@nestjs/common';
import { KafkaModule } from '../kafka/kafka.module';
import { AuditConsumer } from './audit.consumer';

@Module({
  imports: [KafkaModule],
  providers: [AuditConsumer],
})
export class AuditModule {}
