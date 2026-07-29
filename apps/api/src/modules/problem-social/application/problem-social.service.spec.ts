import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AssessmentDifficulty } from '@prisma/client';
import { IProblemSocialRepository } from '../domain/interfaces/problem-social-repository.interface';
import { ProblemDiscussion } from '../domain/entities/problem-discussion';
import { ProblemDiscussionComment } from '../domain/entities/problem-discussion-comment';
import { ProblemList } from '../domain/entities/problem-list';
import {
  BookmarkView,
  ProblemCollectionItemView,
  ProblemCollectionView,
  ProblemDiscussionCommentView,
  ProblemDiscussionView,
  ProblemNoteView,
} from '../domain/read-models/problem-social-view';
import { ProblemSocialService } from './problem-social.service';

const OWNER = 'user-owner';
const OTHER = 'user-other';
const PROBLEM = 'problem-1';

interface StoredList {
  entity: ProblemList;
  items: Array<{ problemId: string; ordinal: number }>;
}

class FakeProblemSocialRepository implements IProblemSocialRepository {
  problems = new Set<string>([PROBLEM, 'A', 'B', 'C']);
  bookmarks = new Set<string>();
  notes = new Map<string, { body: string; updatedAt: Date }>();
  lists = new Map<string, StoredList>();
  acceptedProblemIds = new Map<string, string[]>();
  forkCounter = 0;

  async problemExists(problemId: string): Promise<boolean> {
    return this.problems.has(problemId);
  }

  async listDiscussions(): Promise<ProblemDiscussionView[]> {
    return [];
  }

  async findDiscussionById(): Promise<ProblemDiscussion | null> {
    return null;
  }

  async findDiscussionView(): Promise<ProblemDiscussionView | null> {
    return null;
  }

  createDiscussion(): Promise<void> {
    return Promise.resolve();
  }

  toggleDiscussionVote(): Promise<void> {
    return Promise.resolve();
  }

  async listComments(): Promise<ProblemDiscussionCommentView[]> {
    return [];
  }

  async findCommentById(): Promise<ProblemDiscussionComment | null> {
    return null;
  }

  async findCommentView(): Promise<ProblemDiscussionCommentView | null> {
    return null;
  }

  createComment(): Promise<void> {
    return Promise.resolve();
  }

  toggleCommentVote(): Promise<void> {
    return Promise.resolve();
  }

  async toggleBookmark(userId: string, problemId: string): Promise<boolean> {
    const key = `${userId}:${problemId}`;
    if (this.bookmarks.has(key)) {
      this.bookmarks.delete(key);
      return false;
    }
    this.bookmarks.add(key);
    return true;
  }

  async listBookmarks(): Promise<BookmarkView[]> {
    return [];
  }

  async findNote(userId: string, problemId: string): Promise<ProblemNoteView | null> {
    const stored = this.notes.get(`${userId}:${problemId}`);
    if (!stored) {
      return null;
    }
    return { problemId, body: stored.body, updatedAt: stored.updatedAt };
  }

  async upsertNote(userId: string, problemId: string, body: string): Promise<ProblemNoteView> {
    const updatedAt = new Date();
    this.notes.set(`${userId}:${problemId}`, { body, updatedAt });
    return { problemId, body, updatedAt };
  }

  async listCollections(): Promise<ProblemCollectionView[]> {
    return [];
  }

  async findCollectionById(id: string): Promise<ProblemList | null> {
    return this.lists.get(id)?.entity ?? null;
  }

  async findCollectionView(id: string): Promise<ProblemCollectionView | null> {
    const stored = this.lists.get(id);
    if (!stored) {
      return null;
    }
    const items: ProblemCollectionItemView[] = [...stored.items]
      .sort((a, b) => a.ordinal - b.ordinal)
      .map((item) => ({
        id: `${id}:${item.problemId}`,
        ordinal: item.ordinal,
        problem: {
          id: item.problemId,
          title: item.problemId,
          difficulty: AssessmentDifficulty.EASY,
          tags: [],
          timeLimitMinutes: 30,
        },
      }));
    return {
      id,
      name: stored.entity.getName(),
      isPublic: stored.entity.getIsPublic(),
      itemCount: items.length,
      items,
      createdAt: stored.entity.getCreatedAt(),
    };
  }

  async createCollection(list: ProblemList): Promise<void> {
    this.lists.set(list.getId(), { entity: list, items: [] });
  }

  async updateCollection(list: ProblemList): Promise<void> {
    const stored = this.lists.get(list.getId());
    if (stored) {
      stored.entity = list;
    }
  }

  async deleteCollection(id: string): Promise<void> {
    this.lists.delete(id);
  }

  async addCollectionItem(listId: string, problemId: string): Promise<void> {
    const stored = this.lists.get(listId);
    if (stored) {
      stored.items.push({ problemId, ordinal: stored.items.length });
    }
  }

  async removeCollectionItem(listId: string, problemId: string): Promise<void> {
    const stored = this.lists.get(listId);
    if (stored) {
      stored.items = stored.items.filter((item) => item.problemId !== problemId);
    }
  }

  async listCollectionProblemIds(listId: string): Promise<string[]> {
    const stored = this.lists.get(listId);
    if (!stored) {
      return [];
    }
    return [...stored.items].sort((a, b) => a.ordinal - b.ordinal).map((item) => item.problemId);
  }

  async reorderCollection(listId: string, orderedProblemIds: string[]): Promise<void> {
    const stored = this.lists.get(listId);
    if (!stored) {
      return;
    }
    stored.items = orderedProblemIds.map((problemId, index) => ({ problemId, ordinal: index }));
  }

  async listPublicCollections(filter: {
    search?: string;
    page: number;
    pageSize: number;
  }): Promise<{
    items: ReturnType<FakeProblemSocialRepository['toPublicSummary']>[];
    total: number;
  }> {
    const all = [...this.lists.values()]
      .filter((stored) => stored.entity.getIsPublic())
      .filter(
        (stored) =>
          !filter.search ||
          stored.entity.getName().toLowerCase().includes(filter.search.toLowerCase()),
      );
    const start = (filter.page - 1) * filter.pageSize;
    return {
      items: all
        .slice(start, start + filter.pageSize)
        .map((stored) => this.toPublicSummary(stored)),
      total: all.length,
    };
  }

  async findPublicCollectionDetail(listId: string): Promise<{
    id: string;
    name: string;
    itemCount: number;
    createdAt: Date;
    author: {
      id: string;
      handle: string;
      firstName: string | null;
      lastName: string | null;
      headline: string | null;
    };
    items: ProblemCollectionItemView[];
  } | null> {
    const stored = this.lists.get(listId);
    if (!stored || !stored.entity.getIsPublic()) {
      return null;
    }
    const summary = this.toPublicSummary(stored);
    return { ...summary, items: this.toItemViews(stored) };
  }

  async findAcceptedProblemIds(userId: string): Promise<string[]> {
    return this.acceptedProblemIds.get(userId) ?? [];
  }

  async forkCollection(sourceListId: string, userId: string, name: string): Promise<string> {
    const source = this.lists.get(sourceListId);
    this.forkCounter += 1;
    const newId = `fork-${this.forkCounter}`;
    const entity = ProblemList.create(newId, userId, name, false);
    this.lists.set(newId, {
      entity,
      items: source ? [...source.items] : [],
    });
    return newId;
  }

  private toPublicSummary(stored: StoredList) {
    return {
      id: stored.entity.getId(),
      name: stored.entity.getName(),
      itemCount: stored.items.length,
      createdAt: stored.entity.getCreatedAt(),
      author: {
        id: stored.entity.getUserId(),
        handle: stored.entity.getUserId(),
        firstName: null,
        lastName: null,
        headline: null,
      },
    };
  }

  private toItemViews(stored: StoredList): ProblemCollectionItemView[] {
    return stored.items.map((item) => ({
      id: `${stored.entity.getId()}:${item.problemId}`,
      ordinal: item.ordinal,
      problem: {
        id: item.problemId,
        title: item.problemId,
        difficulty: 'EASY' as AssessmentDifficulty,
        tags: [],
        timeLimitMinutes: 30,
      },
    }));
  }

  seedList(id: string, userId: string, problemIds: string[], isPublic = false): void {
    const entity = ProblemList.create(id, userId, `list-${id}`, isPublic);
    this.lists.set(id, {
      entity,
      items: problemIds.map((problemId, index) => ({ problemId, ordinal: index })),
    });
  }
}

describe('ProblemSocialService', () => {
  let repository: FakeProblemSocialRepository;
  let service: ProblemSocialService;

  beforeEach(() => {
    repository = new FakeProblemSocialRepository();
    service = new ProblemSocialService(repository);
  });

  describe('toggleBookmark', () => {
    it('is idempotent across two toggles', async () => {
      const first = await service.toggleBookmark(OWNER, PROBLEM);
      const second = await service.toggleBookmark(OWNER, PROBLEM);

      expect(first).toBe(true);
      expect(second).toBe(false);
      expect(repository.bookmarks.size).toBe(0);
    });
  });

  describe('upsertNote', () => {
    it('overwrites the existing note and keeps a single row', async () => {
      await service.upsertNote(OWNER, PROBLEM, 'first version');
      const result = await service.upsertNote(OWNER, PROBLEM, 'second version');

      expect(result.body).toBe('second version');
      expect(repository.notes.size).toBe(1);
      expect(repository.notes.get(`${OWNER}:${PROBLEM}`)?.body).toBe('second version');
    });
  });

  describe('reorderCollection', () => {
    it('rewrites ordinals to match the requested order', async () => {
      repository.seedList('list-1', OWNER, ['A', 'B', 'C']);

      const view = await service.reorderCollection(OWNER, 'list-1', ['C', 'A', 'B']);

      expect(view.items.map((item) => [item.problem.id, item.ordinal])).toEqual([
        ['C', 0],
        ['A', 1],
        ['B', 2],
      ]);
    });

    it('rejects a payload referencing unknown problems', async () => {
      repository.seedList('list-1', OWNER, ['A', 'B']);

      await expect(service.reorderCollection(OWNER, 'list-1', ['A', 'X'])).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('ownership guards', () => {
    it('forbids a non-owner and 404s a missing list', async () => {
      repository.seedList('list-1', OWNER, ['A']);

      await expect(service.getCollection(OTHER, 'list-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      await expect(service.getCollection(OWNER, 'missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('public collections', () => {
    it('only ever lists public collections', async () => {
      repository.seedList('private-1', OWNER, ['A'], false);
      repository.seedList('public-1', OWNER, ['A', 'B'], true);

      const page = await service.listPublicCollections({ page: 1, pageSize: 20 });

      expect(page.items.map((item) => item.id)).toEqual(['public-1']);
    });

    it('404s for a private list requested via the public endpoint', async () => {
      repository.seedList('private-1', OWNER, ['A'], false);

      await expect(service.getPublicCollection('private-1', null)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns an empty viewer-progress array for an anonymous viewer', async () => {
      repository.seedList('public-1', OWNER, ['A', 'B'], true);

      const detail = await service.getPublicCollection('public-1', null);

      expect(detail.viewerSolvedProblemIds).toEqual([]);
    });

    it('includes viewer progress only when a viewer is authenticated', async () => {
      repository.seedList('public-1', OWNER, ['A', 'B'], true);
      repository.acceptedProblemIds.set(OTHER, ['A']);

      const detail = await service.getPublicCollection('public-1', OTHER);

      expect(detail.viewerSolvedProblemIds).toEqual(['A']);
    });

    it('forks a public list into a new private list owned by the requester', async () => {
      repository.seedList('public-1', OWNER, ['A', 'B'], true);

      const forked = await service.forkPublicCollection(OTHER, 'public-1');

      expect(forked.isPublic).toBe(false);
      expect(forked.items.map((item) => item.problem.id)).toEqual(['A', 'B']);
      expect(forked.name).toContain('(copy)');
    });

    it('404s when forking a list that is not public', async () => {
      repository.seedList('private-1', OWNER, ['A'], false);

      await expect(service.forkPublicCollection(OTHER, 'private-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
