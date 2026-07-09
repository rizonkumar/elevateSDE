import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PathLevel } from '@prisma/client';
import { ReorderDirection } from '@elevatesde/shared-types';
import { ILearningPathRepository } from '../domain/interfaces/learning-path-repository.interface';
import { LearningPath } from '../domain/entities/learning-path';
import {
  LearningPathCardView,
  LearningPathDetailData,
  LearningPathDetailModuleView,
  LearningPathDetailView,
  LearningPathSummaryData,
  PathProgress,
} from '../domain/read-models/learning-path-view';

const GLOBAL_SCOPE: string | null = null;

export interface SaveLearningPathInput {
  slug: string;
  title: string;
  description: string;
  level: PathLevel;
  tags: string[];
  coverImage: string | null;
}

@Injectable()
export class LearningPathService {
  constructor(private readonly repository: ILearningPathRepository) {}

  async listPublished(userId: string, tenantId: string | null): Promise<LearningPathCardView[]> {
    const [cards, acceptedIds, enrolledIds] = await Promise.all([
      this.repository.findPublishedCards(tenantId),
      this.repository.findAcceptedProblemIds(userId),
      this.repository.findEnrolledPathIds(userId),
    ]);
    const accepted = new Set(acceptedIds);
    const enrolled = new Set(enrolledIds);
    return cards.map((card) => ({
      id: card.id,
      slug: card.slug,
      title: card.title,
      description: card.description,
      level: card.level,
      tags: card.tags,
      coverImage: card.coverImage,
      moduleCount: card.moduleCount,
      problemCount: new Set(card.problemIds).size,
      enrolled: enrolled.has(card.id),
      progress: this.computeProgress(card.problemIds, accepted),
    }));
  }

  async getBySlug(slug: string, userId: string, tenantId: string | null): Promise<LearningPathDetailView> {
    const detail = await this.repository.findPublishedDetailBySlug(slug, tenantId);
    if (!detail) {
      throw new NotFoundException('Learning path not found');
    }
    const [acceptedIds, enrolled] = await Promise.all([
      this.repository.findAcceptedProblemIds(userId),
      this.repository.isEnrolled(userId, detail.id),
    ]);
    const accepted = new Set(acceptedIds);
    const modules = this.buildDetailModules(detail, accepted);
    const problemIds = detail.modules.flatMap((mod) => mod.items.map((item) => item.problemId));
    return {
      id: detail.id,
      slug: detail.slug,
      title: detail.title,
      description: detail.description,
      level: detail.level,
      tags: detail.tags,
      coverImage: detail.coverImage,
      isPublished: detail.isPublished,
      enrolled,
      progress: this.computeProgress(problemIds, accepted),
      resumeProblemId: this.findResumeProblemId(modules),
      modules,
    };
  }

  async enroll(userId: string, pathId: string, tenantId: string | null): Promise<void> {
    const visibleId = await this.repository.findVisiblePublishedId(pathId, tenantId);
    if (!visibleId) {
      throw new NotFoundException('Learning path not found');
    }
    await this.repository.enroll(userId, visibleId);
  }

  async list(): Promise<LearningPathSummaryData[]> {
    return this.repository.list();
  }

  async getDetail(id: string): Promise<LearningPathDetailData> {
    const detail = await this.repository.findAdminDetail(id);
    if (!detail) {
      throw new NotFoundException('Learning path not found');
    }
    return detail;
  }

  async create(input: SaveLearningPathInput): Promise<LearningPathDetailData> {
    const existing = await this.repository.findIdBySlug(input.slug);
    if (existing) {
      throw new ConflictException('A learning path with that slug already exists');
    }
    const path = LearningPath.create({
      slug: input.slug,
      title: input.title,
      description: input.description,
      level: input.level,
      tags: input.tags,
      coverImage: input.coverImage,
      tenantId: GLOBAL_SCOPE,
    });
    await this.repository.create(path);
    return this.getDetail(path.getId());
  }

  async update(id: string, input: SaveLearningPathInput): Promise<LearningPathDetailData> {
    const path = await this.requirePath(id);
    const slugOwner = await this.repository.findIdBySlug(input.slug);
    if (slugOwner && slugOwner !== id) {
      throw new ConflictException('A learning path with that slug already exists');
    }
    await this.repository.update(
      path.withDetails({
        slug: input.slug,
        title: input.title,
        description: input.description,
        level: input.level,
        tags: input.tags,
        coverImage: input.coverImage,
      }),
    );
    return this.getDetail(id);
  }

  async setPublished(id: string, publish: boolean): Promise<LearningPathDetailData> {
    const path = await this.requirePath(id);
    if (publish) {
      const [moduleCount, itemCount] = await Promise.all([
        this.repository.countModules(id),
        this.repository.countItems(id),
      ]);
      if (moduleCount === 0 || itemCount === 0) {
        throw new BadRequestException(
          'Add at least one module with a problem before publishing the path',
        );
      }
    }
    await this.repository.update(path.withPublished(publish));
    return this.getDetail(id);
  }

  async remove(id: string): Promise<void> {
    await this.requirePath(id);
    await this.repository.remove(id);
  }

  async addModule(pathId: string, title: string): Promise<LearningPathDetailData> {
    await this.requirePath(pathId);
    const maxOrder = await this.repository.getMaxModuleOrder(pathId);
    await this.repository.createModule(pathId, title, maxOrder + 1);
    return this.getDetail(pathId);
  }

  async renameModule(moduleId: string, title: string): Promise<LearningPathDetailData> {
    const module = await this.requireModule(moduleId);
    await this.repository.renameModule(moduleId, title);
    return this.getDetail(module.pathId);
  }

  async removeModule(moduleId: string): Promise<LearningPathDetailData> {
    const module = await this.requireModule(moduleId);
    await this.repository.removeModule(moduleId);
    return this.getDetail(module.pathId);
  }

  async reorderModule(
    moduleId: string,
    direction: ReorderDirection,
  ): Promise<LearningPathDetailData> {
    const module = await this.requireModule(moduleId);
    const detail = await this.getDetail(module.pathId);
    const ordered = detail.modules;
    const index = ordered.findIndex((entry) => entry.id === moduleId);
    const neighbor = this.neighborAt(ordered, index, direction);
    if (neighbor) {
      const current = ordered[index];
      if (current) {
        await this.repository.swapModuleOrder(
          current.id,
          current.order,
          neighbor.id,
          neighbor.order,
        );
      }
    }
    return this.getDetail(module.pathId);
  }

  async addItem(moduleId: string, problemId: string): Promise<LearningPathDetailData> {
    const module = await this.requireModule(moduleId);
    const problem = await this.repository.findPublishedProblem(problemId);
    if (!problem) {
      throw new BadRequestException('The problem was not found or is not published');
    }
    if (await this.repository.itemExists(moduleId, problemId)) {
      throw new ConflictException('That problem is already in this module');
    }
    const maxOrder = await this.repository.getMaxItemOrder(moduleId);
    await this.repository.createItem(moduleId, problemId, maxOrder + 1);
    return this.getDetail(module.pathId);
  }

  async removeItem(itemId: string): Promise<LearningPathDetailData> {
    const item = await this.requireItem(itemId);
    await this.repository.removeItem(itemId);
    return this.getDetail(item.pathId);
  }

  async reorderItem(itemId: string, direction: ReorderDirection): Promise<LearningPathDetailData> {
    const item = await this.requireItem(itemId);
    const detail = await this.getDetail(item.pathId);
    const module = detail.modules.find((entry) => entry.id === item.moduleId);
    const ordered = module?.items ?? [];
    const index = ordered.findIndex((entry) => entry.id === itemId);
    const neighbor = this.neighborAt(ordered, index, direction);
    if (neighbor) {
      const current = ordered[index];
      if (current) {
        await this.repository.swapItemOrder(current.id, current.order, neighbor.id, neighbor.order);
      }
    }
    return this.getDetail(item.pathId);
  }

  private neighborAt<T>(ordered: T[], index: number, direction: ReorderDirection): T | null {
    if (index < 0) {
      return null;
    }
    const neighborIndex = direction === 'up' ? index - 1 : index + 1;
    if (neighborIndex < 0 || neighborIndex >= ordered.length) {
      return null;
    }
    return ordered[neighborIndex] ?? null;
  }

  private buildDetailModules(
    detail: LearningPathDetailData,
    accepted: Set<string>,
  ): LearningPathDetailModuleView[] {
    return detail.modules.map((mod) => ({
      id: mod.id,
      title: mod.title,
      order: mod.order,
      items: mod.items.map((item) => ({
        id: item.id,
        problemId: item.problemId,
        title: item.title,
        difficulty: item.difficulty,
        order: item.order,
        solved: accepted.has(item.problemId),
      })),
    }));
  }

  private findResumeProblemId(modules: LearningPathDetailModuleView[]): string | null {
    for (const module of modules) {
      const next = module.items.find((item) => !item.solved);
      if (next) {
        return next.problemId;
      }
    }
    return null;
  }

  private computeProgress(problemIds: string[], accepted: Set<string>): PathProgress {
    const distinct = [...new Set(problemIds)];
    const total = distinct.length;
    const solved = distinct.filter((id) => accepted.has(id)).length;
    const percent = total === 0 ? 0 : Math.round((solved / total) * 100);
    return { solved, total, percent };
  }

  private async requirePath(id: string): Promise<LearningPath> {
    const path = await this.repository.findById(id);
    if (!path) {
      throw new NotFoundException('Learning path not found');
    }
    return path;
  }

  private async requireModule(moduleId: string): Promise<{ id: string; pathId: string }> {
    const module = await this.repository.findModule(moduleId);
    if (!module) {
      throw new NotFoundException('Module not found');
    }
    return module;
  }

  private async requireItem(itemId: string): Promise<{ id: string; moduleId: string; pathId: string }> {
    const item = await this.repository.findItem(itemId);
    if (!item) {
      throw new NotFoundException('Item not found');
    }
    return item;
  }
}
