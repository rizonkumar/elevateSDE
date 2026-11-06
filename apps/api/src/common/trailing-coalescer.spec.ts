import { TimerScheduler, TrailingCoalescer } from './trailing-coalescer';

class ManualScheduler implements TimerScheduler {
  readonly timers: Array<{ callback: () => void; delayMs: number; cancelled: boolean }> = [];

  schedule(callback: () => void, delayMs: number): () => void {
    const timer = { callback, delayMs, cancelled: false };
    this.timers.push(timer);
    return () => {
      timer.cancelled = true;
    };
  }

  flush(): void {
    for (const timer of this.timers.splice(0)) {
      if (!timer.cancelled) {
        timer.callback();
      }
    }
  }
}

describe('TrailingCoalescer', () => {
  it('runs a burst for the same key once after the window', () => {
    const scheduler = new ManualScheduler();
    const coalescer = new TrailingCoalescer(2000, scheduler);
    const task = jest.fn().mockResolvedValue(undefined);

    coalescer.schedule('contest-1', task);
    coalescer.schedule('contest-1', task);
    coalescer.schedule('contest-1', task);

    expect(scheduler.timers).toHaveLength(1);
    expect(scheduler.timers[0]?.delayMs).toBe(2000);
    expect(task).not.toHaveBeenCalled();
    scheduler.flush();
    expect(task).toHaveBeenCalledTimes(1);
    expect(coalescer.isPending('contest-1')).toBe(false);
  });

  it('keeps keys independent and schedules again after a run', () => {
    const scheduler = new ManualScheduler();
    const coalescer = new TrailingCoalescer(2000, scheduler);
    const task = jest.fn().mockResolvedValue(undefined);

    coalescer.schedule('a', task);
    coalescer.schedule('b', task);
    scheduler.flush();
    coalescer.schedule('a', task);
    scheduler.flush();

    expect(task).toHaveBeenCalledTimes(3);
  });

  it('cancels pending work', () => {
    const scheduler = new ManualScheduler();
    const coalescer = new TrailingCoalescer(2000, scheduler);
    const task = jest.fn().mockResolvedValue(undefined);

    coalescer.schedule('a', task);
    coalescer.cancelAll();
    scheduler.flush();

    expect(task).not.toHaveBeenCalled();
  });
});
