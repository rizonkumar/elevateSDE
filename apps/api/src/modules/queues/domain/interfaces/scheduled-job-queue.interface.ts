export type ScheduledJobData = Record<string, never>;

export interface JobSchedule {
  name: string;
  pattern: string;
}

export abstract class IScheduledJobQueue {
  abstract upsertSchedule(schedule: JobSchedule): Promise<void>;
  abstract listScheduleNames(): Promise<string[]>;
  abstract removeSchedule(name: string): Promise<void>;
  abstract enqueueNow(name: string): Promise<void>;
}
