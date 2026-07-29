import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ListChecks } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { AuthorAvatar } from '@/components/dashboard/AuthorAvatar';
import { getPublicCollection } from '@/lib/public-api';
import { cardClass } from '@/lib/ui-classes';
import { QuestionsPanel } from '@/app/dashboard/lists/_components/QuestionsPanel';
import { ForkListButton } from './_components/ForkListButton';

interface PublicListPageProps {
  params: Promise<{ handle: string; listId: string }>;
}

export async function generateMetadata({ params }: PublicListPageProps): Promise<Metadata> {
  const { listId } = await params;
  const list = await getPublicCollection(listId);
  if (!list) {
    return { title: 'List not found — ElevateSDE' };
  }
  const description = `${list.itemCount} curated problems by ${list.author.name} on ElevateSDE.`;
  return {
    title: `${list.name} — ElevateSDE`,
    description,
    openGraph: { title: list.name, description },
  };
}

export default async function PublicListPage({ params }: PublicListPageProps) {
  const { handle, listId } = await params;
  const list = await getPublicCollection(listId);
  if (!list) {
    notFound();
  }

  const solvedSet = new Set(list.viewerSolvedProblemIds);
  const problems = list.items.map((item) => item.problem);

  return (
    <div className="flex min-h-screen flex-col bg-(--color-bg) text-(--color-text-primary)">
      <Navbar />
      <main className="mx-auto w-full max-w-(--page-max-width) flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:gap-8">
          <div className={cardClass}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-(--radius-sm) bg-(--color-accent-soft) text-(--color-accent)">
                  <ListChecks className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h1 className="m-0 font-display text-xl font-semibold tracking-tight">
                    {list.name}
                  </h1>
                  <div className="mt-1 flex items-center gap-2 text-xs text-(--color-text-muted)">
                    <AuthorAvatar name={list.author.name} size="sm" />
                    <a
                      href={`/u/${handle}`}
                      className="font-medium text-(--color-accent) hover:underline"
                    >
                      {list.author.name}
                    </a>
                    <span>· {list.itemCount} problems</span>
                  </div>
                </div>
              </div>
              <ForkListButton listId={list.id} />
            </div>
          </div>

          <div className={cardClass}>
            <QuestionsPanel
              problems={problems}
              solvedSet={solvedSet}
              emptyMessage="This list has no problems yet."
            />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
