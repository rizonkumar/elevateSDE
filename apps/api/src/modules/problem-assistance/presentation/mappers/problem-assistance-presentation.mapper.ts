import {
  ProblemAssistanceView,
  ProblemEditorialView,
  ProblemGuidanceAdminView,
} from '../../domain/read-models/problem-guidance';
import { ProblemAssistanceResponseDto } from '../dtos/problem-assistance-response.dto';
import { ProblemEditorialResponseDto } from '../dtos/problem-editorial-response.dto';
import { ProblemHintResponseDto } from '../dtos/problem-hint-response.dto';
import {
  AdminProblemEditorialResponseDto,
  AdminProblemGuidanceResponseDto,
} from '../dtos/admin-problem-guidance-response.dto';

export class ProblemAssistancePresentationMapper {
  static toAssistanceResponse(view: ProblemAssistanceView): ProblemAssistanceResponseDto {
    const dto = new ProblemAssistanceResponseDto();
    dto.problemId = view.problemId;
    dto.totalHints = view.totalHints;
    dto.hints = view.hints.map((hint) => {
      const hintDto = new ProblemHintResponseDto();
      hintDto.ordinal = hint.ordinal;
      hintDto.content = hint.content;
      return hintDto;
    });
    dto.editorial = view.editorial;
    dto.unlockReason = view.unlockReason;
    dto.lockedByContest = view.lockedByContest;
    return dto;
  }

  static toEditorialResponse(view: ProblemEditorialView): ProblemEditorialResponseDto {
    const dto = new ProblemEditorialResponseDto();
    dto.problemId = view.problemId;
    dto.approach = view.approach;
    dto.timeComplexity = view.timeComplexity;
    dto.spaceComplexity = view.spaceComplexity;
    dto.solutions = view.solutions;
    dto.unlockReason = view.unlockReason;
    dto.updatedAt = view.updatedAt.toISOString();
    return dto;
  }

  static toAdminGuidanceResponse(view: ProblemGuidanceAdminView): AdminProblemGuidanceResponseDto {
    const dto = new AdminProblemGuidanceResponseDto();
    dto.problemId = view.problemId;
    dto.hints = view.hints;
    if (view.editorial) {
      const editorial = new AdminProblemEditorialResponseDto();
      editorial.approach = view.editorial.approach;
      editorial.timeComplexity = view.editorial.timeComplexity;
      editorial.spaceComplexity = view.editorial.spaceComplexity;
      editorial.isPublished = view.editorial.isPublished;
      editorial.updatedAt = view.editorial.updatedAt.toISOString();
      dto.editorial = editorial;
    } else {
      dto.editorial = null;
    }
    return dto;
  }
}
