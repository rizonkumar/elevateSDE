import { LearningPath } from '../entities/learning-path';
import {
  ItemRef,
  LearningPathCardData,
  LearningPathDetailData,
  LearningPathSummaryData,
  ModuleRef,
  PublishedProblemRef,
} from '../read-models/learning-path-view';

export abstract class ILearningPathRepository {
  abstract list(): Promise<LearningPathSummaryData[]>;
  abstract findAdminDetail(id: string): Promise<LearningPathDetailData | null>;
  abstract findById(id: string): Promise<LearningPath | null>;
  abstract findIdBySlug(slug: string): Promise<string | null>;
  abstract create(path: LearningPath): Promise<void>;
  abstract update(path: LearningPath): Promise<void>;
  abstract remove(id: string): Promise<void>;
  abstract countModules(pathId: string): Promise<number>;
  abstract countItems(pathId: string): Promise<number>;

  abstract findPublishedCards(tenantId: string | null): Promise<LearningPathCardData[]>;
  abstract findPublishedDetailBySlug(
    slug: string,
    tenantId: string | null,
  ): Promise<LearningPathDetailData | null>;
  abstract findVisiblePublishedId(id: string, tenantId: string | null): Promise<string | null>;
  abstract findAcceptedProblemIds(userId: string): Promise<string[]>;
  abstract findEnrolledPathIds(userId: string): Promise<string[]>;
  abstract isEnrolled(userId: string, pathId: string): Promise<boolean>;
  abstract enroll(userId: string, pathId: string): Promise<void>;

  abstract findModule(moduleId: string): Promise<ModuleRef | null>;
  abstract getMaxModuleOrder(pathId: string): Promise<number>;
  abstract createModule(pathId: string, title: string, order: number): Promise<void>;
  abstract renameModule(moduleId: string, title: string): Promise<void>;
  abstract removeModule(moduleId: string): Promise<void>;
  abstract swapModuleOrder(
    firstId: string,
    firstOrder: number,
    secondId: string,
    secondOrder: number,
  ): Promise<void>;

  abstract findItem(itemId: string): Promise<ItemRef | null>;
  abstract getMaxItemOrder(moduleId: string): Promise<number>;
  abstract findPublishedProblem(problemId: string): Promise<PublishedProblemRef | null>;
  abstract itemExists(moduleId: string, problemId: string): Promise<boolean>;
  abstract createItem(moduleId: string, problemId: string, order: number): Promise<void>;
  abstract removeItem(itemId: string): Promise<void>;
  abstract swapItemOrder(
    firstId: string,
    firstOrder: number,
    secondId: string,
    secondOrder: number,
  ): Promise<void>;
}
