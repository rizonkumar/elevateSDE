import { PointsBackfillResult } from '../../domain/read-models/scoring-result';
import { ScoringBackfillResponseDto } from '../dtos/scoring-backfill-response.dto';

export class ScoringPresentationMapper {
  static toBackfillResponse(result: PointsBackfillResult): ScoringBackfillResponseDto {
    const response = new ScoringBackfillResponseDto();
    response.usersTouched = result.usersTouched;
    response.awardsInserted = result.awardsInserted;
    response.pointsAwarded = result.pointsAwarded;
    response.dryRun = result.dryRun;
    return response;
  }
}
