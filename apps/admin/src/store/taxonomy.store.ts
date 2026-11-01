import { create } from 'zustand';
import type { TopicDto } from '@elevatesde/shared-types';
import {
  createTerm,
  deleteTerm,
  fetchTerms,
  renameTerm,
  type TaxonomyKind,
} from '../lib/taxonomy-api';
import { useToastStore } from './toast.store';

interface TaxonomyState {
  terms: Record<TaxonomyKind, TopicDto[]>;
  loaded: Record<TaxonomyKind, boolean>;
  loading: boolean;
  savingKey: string | null;
  load: (kind: TaxonomyKind, force?: boolean) => Promise<void>;
  create: (kind: TaxonomyKind, name: string) => Promise<boolean>;
  rename: (kind: TaxonomyKind, id: string, name: string) => Promise<boolean>;
  remove: (kind: TaxonomyKind, id: string) => Promise<void>;
}

interface AxiosErrorResponse {
  response?: { data?: { message?: string | string[] } };
}

const errorMessage = (error: unknown, fallback: string): string => {
  const message = (error as AxiosErrorResponse).response?.data?.message;
  if (Array.isArray(message)) {
    return message[0] ?? fallback;
  }
  return message ?? fallback;
};

const notify = (message: string, type: 'success' | 'error') =>
  useToastStore.getState().addToast(message, type);

const byName = (left: TopicDto, right: TopicDto) => left.name.localeCompare(right.name);

const LABEL: Record<TaxonomyKind, string> = { topic: 'Topic', company: 'Company' };

export const useTaxonomyStore = create<TaxonomyState>((set, get) => ({
  terms: { topic: [], company: [] },
  loaded: { topic: false, company: false },
  loading: false,
  savingKey: null,

  load: async (kind, force = false) => {
    if (get().loaded[kind] && !force) {
      return;
    }
    set({ loading: true });
    try {
      const terms = await fetchTerms(kind);
      set((state) => ({
        terms: { ...state.terms, [kind]: terms },
        loaded: { ...state.loaded, [kind]: true },
      }));
    } catch (error) {
      notify(
        errorMessage(error, `Could not load ${kind === 'topic' ? 'topics' : 'companies'}.`),
        'error',
      );
    } finally {
      set({ loading: false });
    }
  },

  create: async (kind, name) => {
    set({ savingKey: `${kind}:new` });
    try {
      const term = await createTerm(kind, name);
      set((state) => ({
        terms: { ...state.terms, [kind]: [...state.terms[kind], term].sort(byName) },
      }));
      notify(`${LABEL[kind]} "${term.name}" added.`, 'success');
      return true;
    } catch (error) {
      notify(errorMessage(error, `Could not add the ${kind}.`), 'error');
      return false;
    } finally {
      set({ savingKey: null });
    }
  },

  rename: async (kind, id, name) => {
    set({ savingKey: `${kind}:${id}` });
    try {
      const term = await renameTerm(kind, id, name);
      set((state) => ({
        terms: {
          ...state.terms,
          [kind]: state.terms[kind].map((item) => (item.id === id ? term : item)).sort(byName),
        },
      }));
      notify(`${LABEL[kind]} renamed.`, 'success');
      return true;
    } catch (error) {
      notify(errorMessage(error, `Could not rename the ${kind}.`), 'error');
      return false;
    } finally {
      set({ savingKey: null });
    }
  },

  remove: async (kind, id) => {
    set({ savingKey: `${kind}:${id}` });
    try {
      await deleteTerm(kind, id);
      set((state) => ({
        terms: { ...state.terms, [kind]: state.terms[kind].filter((item) => item.id !== id) },
      }));
      notify(`${LABEL[kind]} deleted.`, 'success');
    } catch (error) {
      notify(errorMessage(error, `Could not delete the ${kind}.`), 'error');
    } finally {
      set({ savingKey: null });
    }
  },
}));
