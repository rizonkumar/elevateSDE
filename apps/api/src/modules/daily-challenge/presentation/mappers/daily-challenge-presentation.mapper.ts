import { toDateKey } from '../../domain/daily-date';
import {
  DailyChallengeScheduleView,
  DailyChallengeView,
  StreakSummaryView,
} from '../../domain/read-models/daily-challenge-view';
import { ProblemSummaryResponseDto } from '../../../problem/presentation/dtos/problem-summary-response.dto';
import { DailyChallengeResponseDto } from '../dtos/daily-challenge-response.dto';
import { DailyChallengeScheduleResponseDto } from '../dtos/daily-challenge-schedule-response.dto';
import {
  StreakCalendarCellResponseDto,
  StreakSummaryResponseDto,
} from '../dtos/streak-summary-response.dto';

export class DailyChallengePresentationMapper {
  static toDaily(view: DailyChallengeView): DailyChallengeResponseDto {
    const problem = new ProblemSummaryResponseDto();
    problem.id = view.problem.id;
    problem.title = view.problem.title;
    problem.difficulty = view.problem.difficulty;
    problem.tags = view.problem.tags;
    problem.timeLimitMinutes = view.problem.timeLimitMinutes;

    const dto = new DailyChallengeResponseDto();
    dto.id = view.id;
    dto.challengeDate = toDateKey(view.challengeDate);
    dto.problem = problem;
    dto.completed = view.completed;
    return dto;
  }

  static toStreak(view: StreakSummaryView): StreakSummaryResponseDto {
    const dto = new StreakSummaryResponseDto();
    dto.current = view.current;
    dto.longest = view.longest;
    dto.lastActiveDate = view.lastActiveDate ? toDateKey(view.lastActiveDate) : null;
    dto.calendar = view.calendar.map((cell) => {
      const cellDto = new StreakCalendarCellResponseDto();
      cellDto.date = toDateKey(cell.date);
      cellDto.completed = cell.completed;
      return cellDto;
    });
    return dto;
  }

  static toSchedule(view: DailyChallengeScheduleView): DailyChallengeScheduleResponseDto {
    const dto = new DailyChallengeScheduleResponseDto();
    dto.id = view.id;
    dto.challengeDate = toDateKey(view.challengeDate);
    dto.problemId = view.problemId;
    dto.problemTitle = view.problemTitle;
    dto.difficulty = view.difficulty;
    dto.completionCount = view.completionCount;
    return dto;
  }
}
