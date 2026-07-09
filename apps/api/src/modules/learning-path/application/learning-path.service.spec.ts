import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PathLevel } from '@prisma/client';
import { LearningPathService } from './learning-path.service';
import { ILearningPathRepository } from '../domain/interfaces/learning-path-repository.interface';
import { LearningPath } from '../domain/entities/learning-path';
import {
  ItemRef,
  LearningPathCardData,
  LearningPathDetailData,
  LearningPathSummaryData,
  ModuleRef,
  PublishedProblemRef,
} from '../domain/read-models/learning-path-view';

const buildDetail = (overrides: Partial<LearningPathDetailData> = {}): LearningPathDetailData => ({
  id: 'path-1',
  slug: 'faang-dsa',
  title: 'FAANG DSA',
  description: 'desc',
  level: PathLevel.BEGINNER,
  tags: [],
  coverImage: null,
  isPublished: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  modules: [
    {
      id: 'mod-1',
      title: 'Arrays',
      order: 0,
      items: [
        { id: 'item-1', problemId: 'p1', title: 'P1', difficulty: 'EASY', order: 0 },
        { id: 'item-2', problemId: 'p2', title: 'P2', difficulty: 'MEDIUM', order: 1 },
      ],
    },
  ],
  ...overrides,
});

class FakeRepository implements ILearningPathRepository {
  cards: LearningPathCardData[] = [];
  detail: LearningPathDetailData | null = buildDetail();
  accepted: string[] = [];
  enrolledIds: string[] = [];
  slugOwner: string | null = null;
  moduleCount = 1;
  itemCount = 2;
  visiblePublishedId: string | null = 'path-1';
  enrollCalls: Array<{ userId: string; pathId: string }> = [];
  saved: LearningPath[] = [];

  async list(): Promise<LearningPathSummaryData[]> {
    return [];
  }
  async findAdminDetail(): Promise<LearningPathDetailData | null> {
    return this.detail;
  }
  async findById(id: string): Promise<LearningPath | null> {
    if (!this.detail || this.detail.id !== id) {
      return null;
    }
    return LearningPath.reconstitute({
      id: this.detail.id,
      slug: this.detail.slug,
      title: this.detail.title,
      description: this.detail.description,
      level: this.detail.level,
      tags: this.detail.tags,
      coverImage: this.detail.coverImage,
      isPublished: this.detail.isPublished,
      tenantId: null,
      order: 0,
      createdAt: this.detail.createdAt,
      updatedAt: this.detail.updatedAt,
    });
  }
  async findIdBySlug(): Promise<string | null> {
    return this.slugOwner;
  }
  async create(path: LearningPath): Promise<void> {
    this.saved.push(path);
  }
  async update(path: LearningPath): Promise<void> {
    this.saved.push(path);
  }
  async remove(): Promise<void> {}
  async countModules(): Promise<number> {
    return this.moduleCount;
  }
  async countItems(): Promise<number> {
    return this.itemCount;
  }
  async findPublishedCards(): Promise<LearningPathCardData[]> {
    return this.cards;
  }
  async findPublishedDetailBySlug(): Promise<LearningPathDetailData | null> {
    return this.detail;
  }
  async findVisiblePublishedId(): Promise<string | null> {
    return this.visiblePublishedId;
  }
  async findAcceptedProblemIds(): Promise<string[]> {
    return this.accepted;
  }
  async findEnrolledPathIds(): Promise<string[]> {
    return this.enrolledIds;
  }
  async isEnrolled(_userId: string, pathId: string): Promise<boolean> {
    return this.enrolledIds.includes(pathId);
  }
  async enroll(userId: string, pathId: string): Promise<void> {
    this.enrollCalls.push({ userId, pathId });
  }
  async findModule(): Promise<ModuleRef | null> {
    return null;
  }
  async getMaxModuleOrder(): Promise<number> {
    return -1;
  }
  async createModule(): Promise<void> {}
  async renameModule(): Promise<void> {}
  async removeModule(): Promise<void> {}
  async swapModuleOrder(): Promise<void> {}
  async findItem(): Promise<ItemRef | null> {
    return null;
  }
  async getMaxItemOrder(): Promise<number> {
    return -1;
  }
  async findPublishedProblem(): Promise<PublishedProblemRef | null> {
    return null;
  }
  async itemExists(): Promise<boolean> {
    return false;
  }
  async createItem(): Promise<void> {}
  async removeItem(): Promise<void> {}
  async swapItemOrder(): Promise<void> {}
}

describe('LearningPathService', () => {
  let repository: FakeRepository;
  let service: LearningPathService;

  beforeEach(() => {
    repository = new FakeRepository();
    service = new LearningPathService(repository);
  });

  describe('listPublished', () => {
    it('derives progress from accepted submissions and dedupes shared problems', async () => {
      repository.cards = [
        {
          id: 'path-1',
          slug: 'faang-dsa',
          title: 'FAANG DSA',
          description: 'desc',
          level: PathLevel.BEGINNER,
          tags: [],
          coverImage: null,
          moduleCount: 2,
          problemIds: ['p1', 'p2', 'p1'],
        },
      ];
      repository.accepted = ['p1'];
      repository.enrolledIds = ['path-1'];

      const [card] = await service.listPublished('user-1', null);

      expect(card?.progress).toEqual({ solved: 1, total: 2, percent: 50 });
      expect(card?.problemCount).toBe(2);
      expect(card?.enrolled).toBe(true);
    });
  });

  describe('getBySlug', () => {
    it('marks solved items, computes progress, and resumes at the first unsolved problem', async () => {
      repository.accepted = ['p1'];
      repository.enrolledIds = ['path-1'];

      const view = await service.getBySlug('faang-dsa', 'user-1', null);

      expect(view.progress).toEqual({ solved: 1, total: 2, percent: 50 });
      expect(view.resumeProblemId).toBe('p2');
      expect(view.modules[0]?.items[0]?.solved).toBe(true);
      expect(view.modules[0]?.items[1]?.solved).toBe(false);
    });

    it('returns a null resume target when every problem is solved', async () => {
      repository.accepted = ['p1', 'p2'];

      const view = await service.getBySlug('faang-dsa', 'user-1', null);

      expect(view.progress.percent).toBe(100);
      expect(view.resumeProblemId).toBeNull();
    });

    it('throws when the path is not visible', async () => {
      repository.detail = null;

      await expect(service.getBySlug('missing', 'user-1', null)).rejects.toThrow(NotFoundException);
    });
  });

  describe('enroll', () => {
    it('enrolls against the visible published id', async () => {
      await service.enroll('user-1', 'path-1', null);

      expect(repository.enrollCalls).toEqual([{ userId: 'user-1', pathId: 'path-1' }]);
    });

    it('rejects enrollment when the path is not visible', async () => {
      repository.visiblePublishedId = null;

      await expect(service.enroll('user-1', 'path-1', null)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('rejects a duplicate slug', async () => {
      repository.slugOwner = 'other-path';

      await expect(
        service.create({
          slug: 'faang-dsa',
          title: 'x',
          description: 'y',
          level: PathLevel.BEGINNER,
          tags: [],
          coverImage: null,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('setPublished', () => {
    it('blocks publishing a path with no items', async () => {
      repository.itemCount = 0;

      await expect(service.setPublished('path-1', true)).rejects.toThrow(BadRequestException);
    });

    it('allows unpublishing regardless of content', async () => {
      repository.itemCount = 0;

      await expect(service.setPublished('path-1', false)).resolves.toBeDefined();
    });
  });
});
