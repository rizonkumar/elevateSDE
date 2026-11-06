import 'reflect-metadata';
import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ContestRatingService } from '../modules/contest/application/contest-rating.service';
import { RatingsBackfillModule } from './ratings-backfill.module';

async function backfill(): Promise<void> {
  const logger = new Logger('RatingsBackfill');
  const app = await NestFactory.createApplicationContext(RatingsBackfillModule, {
    logger: ['log', 'warn', 'error'],
  });
  try {
    const ratingService = app.get(ContestRatingService);
    let total = 0;
    let rated = await ratingService.ratePending();
    while (rated > 0) {
      total += rated;
      rated = await ratingService.ratePending();
    }
    logger.log(`Processed ${total} finalized contests.`);
  } finally {
    await app.close();
  }
}

backfill().catch((error: unknown) => {
  new Logger('RatingsBackfill').error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
