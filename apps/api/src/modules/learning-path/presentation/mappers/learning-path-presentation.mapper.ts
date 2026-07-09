import {
  LearningPathCardView,
  LearningPathDetailData,
  LearningPathDetailView,
  LearningPathSummaryData,
} from '../../domain/read-models/learning-path-view';
import {
  AdminLearningPathDetailResponseDto,
  AdminLearningPathModuleItemResponseDto,
  AdminLearningPathModuleResponseDto,
  AdminLearningPathSummaryResponseDto,
} from '../dtos/admin-learning-path-response.dto';
import {
  LearningPathDetailResponseDto,
  LearningPathItemResponseDto,
  LearningPathModuleResponseDto,
  LearningPathResponseDto,
  PathProgressResponseDto,
} from '../dtos/learning-path-response.dto';
import { PathProgress } from '../../domain/read-models/learning-path-view';

export class LearningPathPresentationMapper {
  static toAdminSummary(data: LearningPathSummaryData): AdminLearningPathSummaryResponseDto {
    const dto = new AdminLearningPathSummaryResponseDto();
    dto.id = data.id;
    dto.slug = data.slug;
    dto.title = data.title;
    dto.level = data.level;
    dto.moduleCount = data.moduleCount;
    dto.problemCount = data.problemCount;
    dto.isPublished = data.isPublished;
    dto.createdAt = data.createdAt.toISOString();
    dto.updatedAt = data.updatedAt.toISOString();
    return dto;
  }

  static toAdminDetail(data: LearningPathDetailData): AdminLearningPathDetailResponseDto {
    const dto = new AdminLearningPathDetailResponseDto();
    dto.id = data.id;
    dto.slug = data.slug;
    dto.title = data.title;
    dto.level = data.level;
    dto.moduleCount = data.modules.length;
    dto.problemCount = data.modules.reduce((sum, mod) => sum + mod.items.length, 0);
    dto.isPublished = data.isPublished;
    dto.createdAt = data.createdAt.toISOString();
    dto.updatedAt = data.updatedAt.toISOString();
    dto.description = data.description;
    dto.tags = data.tags;
    dto.coverImage = data.coverImage;
    dto.modules = data.modules.map((mod) => {
      const moduleDto = new AdminLearningPathModuleResponseDto();
      moduleDto.id = mod.id;
      moduleDto.title = mod.title;
      moduleDto.order = mod.order;
      moduleDto.items = mod.items.map((item) => {
        const itemDto = new AdminLearningPathModuleItemResponseDto();
        itemDto.id = item.id;
        itemDto.problemId = item.problemId;
        itemDto.title = item.title;
        itemDto.difficulty = item.difficulty;
        itemDto.order = item.order;
        return itemDto;
      });
      return moduleDto;
    });
    return dto;
  }

  static toCard(view: LearningPathCardView): LearningPathResponseDto {
    const dto = new LearningPathResponseDto();
    dto.id = view.id;
    dto.slug = view.slug;
    dto.title = view.title;
    dto.description = view.description;
    dto.level = view.level;
    dto.tags = view.tags;
    dto.coverImage = view.coverImage;
    dto.moduleCount = view.moduleCount;
    dto.problemCount = view.problemCount;
    dto.enrolled = view.enrolled;
    dto.progress = this.toProgress(view.progress);
    return dto;
  }

  static toCandidateDetail(view: LearningPathDetailView): LearningPathDetailResponseDto {
    const dto = new LearningPathDetailResponseDto();
    dto.id = view.id;
    dto.slug = view.slug;
    dto.title = view.title;
    dto.description = view.description;
    dto.level = view.level;
    dto.tags = view.tags;
    dto.coverImage = view.coverImage;
    dto.isPublished = view.isPublished;
    dto.enrolled = view.enrolled;
    dto.progress = this.toProgress(view.progress);
    dto.resumeProblemId = view.resumeProblemId;
    dto.modules = view.modules.map((mod) => {
      const moduleDto = new LearningPathModuleResponseDto();
      moduleDto.id = mod.id;
      moduleDto.title = mod.title;
      moduleDto.order = mod.order;
      moduleDto.items = mod.items.map((item) => {
        const itemDto = new LearningPathItemResponseDto();
        itemDto.id = item.id;
        itemDto.problemId = item.problemId;
        itemDto.title = item.title;
        itemDto.difficulty = item.difficulty;
        itemDto.order = item.order;
        itemDto.solved = item.solved;
        return itemDto;
      });
      return moduleDto;
    });
    return dto;
  }

  private static toProgress(progress: PathProgress): PathProgressResponseDto {
    const dto = new PathProgressResponseDto();
    dto.solved = progress.solved;
    dto.total = progress.total;
    dto.percent = progress.percent;
    return dto;
  }
}
