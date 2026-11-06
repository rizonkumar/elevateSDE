import { ContestScheduledJobsService } from './contest-scheduled-jobs.service';
import { ContestFinalizationService } from './contest-finalization.service';
import { ContestLifecycleBroadcaster } from './contest-lifecycle-broadcaster.service';
import { ContestRatingService } from './contest-rating.service';

function build() {
  const finalizeEnded = jest.fn().mockResolvedValue(4);
  const ratePending = jest.fn().mockResolvedValue(2);
  const broadcastRecent = jest.fn().mockResolvedValue(8);
  const service = new ContestScheduledJobsService(
    { finalizeEnded } as unknown as ContestFinalizationService,
    { ratePending } as unknown as ContestRatingService,
    { broadcastRecent } as unknown as ContestLifecycleBroadcaster,
  );
  return { service, finalizeEnded, ratePending, broadcastRecent };
}

describe('ContestScheduledJobsService', () => {
  it('rates finalized contests right after finalizing them and sums the work', async () => {
    const { service, finalizeEnded, ratePending } = build();

    await expect(service.finalizeAndRate()).resolves.toBe(6);

    expect(ratePending).toHaveBeenCalledTimes(1);
    expect(ratePending.mock.invocationCallOrder[0]).toBeGreaterThan(
      finalizeEnded.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it('does not rate when finalization fails', async () => {
    const { service, finalizeEnded, ratePending } = build();
    finalizeEnded.mockRejectedValue(new Error('deadlock'));

    await expect(service.finalizeAndRate()).rejects.toThrow('deadlock');
    expect(ratePending).not.toHaveBeenCalled();
  });

  it('broadcasts recent lifecycle changes', async () => {
    const { service, broadcastRecent } = build();

    await expect(service.broadcastStatus()).resolves.toBe(8);
    expect(broadcastRecent).toHaveBeenCalledTimes(1);
  });
});
