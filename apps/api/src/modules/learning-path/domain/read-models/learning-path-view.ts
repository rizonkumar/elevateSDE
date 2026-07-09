import { AssessmentDifficulty, PathLevel } from '@prisma/client';

export interface LearningPathSummaryData {
  id: string;
  slug: string;
  title: string;
  level: PathLevel;
  moduleCount: number;
  problemCount: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LearningPathItemData {
  id: string;
  problemId: string;
  title: string;
  difficulty: AssessmentDifficulty;
  order: number;
}

export interface LearningPathModuleData {
  id: string;
  title: string;
  order: number;
  items: LearningPathItemData[];
}

export interface LearningPathDetailData {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: PathLevel;
  tags: string[];
  coverImage: string | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  modules: LearningPathModuleData[];
}

export interface LearningPathCardData {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: PathLevel;
  tags: string[];
  coverImage: string | null;
  moduleCount: number;
  problemIds: string[];
}

export interface PathProgress {
  solved: number;
  total: number;
  percent: number;
}

export interface LearningPathCardView {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: PathLevel;
  tags: string[];
  coverImage: string | null;
  moduleCount: number;
  problemCount: number;
  enrolled: boolean;
  progress: PathProgress;
}

export interface LearningPathDetailItemView {
  id: string;
  problemId: string;
  title: string;
  difficulty: AssessmentDifficulty;
  order: number;
  solved: boolean;
}

export interface LearningPathDetailModuleView {
  id: string;
  title: string;
  order: number;
  items: LearningPathDetailItemView[];
}

export interface LearningPathDetailView {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: PathLevel;
  tags: string[];
  coverImage: string | null;
  isPublished: boolean;
  enrolled: boolean;
  progress: PathProgress;
  resumeProblemId: string | null;
  modules: LearningPathDetailModuleView[];
}

export interface PublishedProblemRef {
  id: string;
  title: string;
  difficulty: AssessmentDifficulty;
}

export interface ModuleRef {
  id: string;
  pathId: string;
  order: number;
}

export interface ItemRef {
  id: string;
  moduleId: string;
  pathId: string;
  order: number;
}
