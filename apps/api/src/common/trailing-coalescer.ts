export type CancelTimer = () => void;

export interface TimerScheduler {
  schedule(callback: () => void, delayMs: number): CancelTimer;
}

export const TIMER_SCHEDULER = Symbol('TIMER_SCHEDULER');

export const systemTimerScheduler: TimerScheduler = {
  schedule(callback, delayMs) {
    const handle = setTimeout(callback, delayMs);
    return () => clearTimeout(handle);
  },
};

export class TrailingCoalescer {
  private readonly pending = new Map<string, CancelTimer>();

  constructor(
    private readonly windowMs: number,
    private readonly scheduler: TimerScheduler = systemTimerScheduler,
  ) {}

  schedule(key: string, task: () => Promise<void>): void {
    if (this.pending.has(key)) {
      return;
    }
    const cancel = this.scheduler.schedule(() => {
      this.pending.delete(key);
      void task();
    }, this.windowMs);
    this.pending.set(key, cancel);
  }

  isPending(key: string): boolean {
    return this.pending.has(key);
  }

  cancelAll(): void {
    for (const cancel of this.pending.values()) {
      cancel();
    }
    this.pending.clear();
  }
}
