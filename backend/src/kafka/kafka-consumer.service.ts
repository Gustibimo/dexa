import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';

@Injectable()
export class KafkaConsumerService implements OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private readonly kafka: Kafka;
  private readonly consumers: Consumer[] = [];

  constructor() {
    const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
    this.kafka = new Kafka({
      clientId: 'attendance-backend',
      brokers,
    });
  }

  async createConsumer(groupId: string): Promise<Consumer> {
    const consumer = this.kafka.consumer({ groupId });
    this.consumers.push(consumer);
    await consumer.connect();
    this.logger.log(`Kafka consumer connected [group=${groupId}]`);
    return consumer;
  }

  async subscribe(
    consumer: Consumer,
    topic: string,
    callback: (message: Record<string, unknown>) => void,
  ): Promise<void> {
    await consumer.subscribe({ topic, fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ message }: EachMessagePayload) => {
        try {
          const value = message.value?.toString();
          if (value) {
            callback(JSON.parse(value));
          }
        } catch (err) {
          this.logger.error(
            `Error processing message from topic "${topic}"`,
            err instanceof Error ? err.stack : String(err),
          );
        }
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    for (const consumer of this.consumers) {
      await consumer.disconnect();
    }
    this.logger.log('All Kafka consumers disconnected.');
  }
}
