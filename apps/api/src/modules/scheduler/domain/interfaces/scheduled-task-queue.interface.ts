export abstract class IScheduledTaskQueue {
  abstract registerAll(): Promise<void>;
}
