import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES, QUEUE_PREFIX } from './domain/queue-names';
import { ICodeExecutionQueue } from './domain/interfaces/code-execution-queue.interface';
import { CodeExecutionQueue } from './application/code-execution.queue';
import { buildRedisConnection } from './infrastructure/redis-connection';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => ({ connection: buildRedisConnection(), prefix: QUEUE_PREFIX }),
    }),
    BullModule.registerQueue({ name: QUEUE_NAMES.CODE_EXECUTION }),
  ],
  providers: [{ provide: ICodeExecutionQueue, useClass: CodeExecutionQueue }],
  exports: [ICodeExecutionQueue, BullModule],
})
export class QueuesModule {}
