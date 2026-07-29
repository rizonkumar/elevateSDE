import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Award, Flame, Trophy, Zap } from 'lucide-react';
import type { AssessmentDifficulty } from '@elevatesde/shared-types';
import { Navbar } from '@/components/Navbar';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { ContributionHeatmap } from '@/components/dashboard/profile/ContributionHeatmap';
import { PublicBadgeGrid } from '@/components/dashboard/profile/PublicBadgeGrid';
import { getNameInitials } from '@/lib/relative-time';
import { getPublicProfile } from '@/lib/public-api';
import { cardClass } from '@/lib/ui-classes';

interface PublicProfilePageProps {
  params: Promise<{ handle: string }>;
}

const DIFFICULTIES: { key: AssessmentDifficulty; label: string; tone: string }[] = [
  { key: 'EASY', label: 'Easy', tone: 'text-(--color-success)' },
  { key: 'MEDIUM', label: 'Medium', tone: 'text-(--color-warning)' },
  { key: 'HARD', label: 'Hard', tone: 'text-(--color-danger)' },
];

function displayName(handle: string, firstName: string | null, lastName: string | null): string {
  const name = [firstName, lastName].filter((part) => part && part.trim()).join(' ');
  return name.length > 0 ? name : handle;
}

function joinedLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export async function generateMetadata({
  params,
}: PublicProfilePageProps): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getPublicProfile(handle);
  if (!profile) {
    return { title: 'Profile not found — ElevateSDE' };
  }
  const name = displayName(profile.handle, profile.firstName, profile.lastName);
  const description =
    profile.headline ??
    `${profile.stats.problemsSolved} problems solved · ${profile.stats.points.toLocaleString()} points on ElevateSDE.`;
  return {
    title: `${name} (@${profile.handle}) — ElevateSDE`,
    description,
    openGraph: { title: `${name} on ElevateSDE`, description },
  };
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { handle } = await params;
  const profile = await getPublicProfile(handle);
  if (!profile) {
    notFound();
  }

  const name = displayName(profile.handle, profile.firstName, profile.lastName);
  const tiles = [
    { icon: Zap, label: 'Points', value: profile.stats.points.toLocaleString() },
    {
      icon: Trophy,
      label: 'Global rank',
      value: profile.stats.rank ? `#${profile.stats.rank}` : '—',
    },
    { icon: Flame, label: 'Current streak', value: `${profile.stats.streakDays} d` },
    { icon: Award, label: 'Longest streak', value: `${profile.stats.longestStreak} d` },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-(--color-bg) text-(--color-text-primary)">
      <Navbar />
      <main className="mx-auto w-full max-w-(--page-max-width) flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:gap-8">
          <div className={cardClass}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-(--radius-full) bg-(--color-accent-soft) font-display text-xl font-semibold text-(--color-accent)">
                {getNameInitials(name)}
              </span>
              <div className="min-w-0">
                <h1 className="m-0 font-display text-xl font-semibold tracking-tight">{name}</h1>
                <p className="mt-0.5 mb-0 text-sm text-(--color-text-muted)">@{profile.handle}</p>
                {profile.headline && (
                  <p className="mt-1 mb-0 text-sm text-(--color-text-muted)">{profile.headline}</p>
                )}
                {profile.bio && (
                  <p className="mt-2 mb-0 max-w-xl text-sm text-(--color-text-primary)">
                    {profile.bio}
                  </p>
                )}
                <p className="mt-2 mb-0 text-xs text-(--color-text-muted)">
                  Joined {joinedLabel(profile.joinedAt)}
                </p>
                {(profile.githubUrl || profile.linkedinUrl || profile.websiteUrl) && (
                  <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium text-(--color-accent)">
                    {profile.githubUrl && (
                      <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer">
                        GitHub
                      </a>
                    )}
                    {profile.linkedinUrl && (
                      <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer">
                        LinkedIn
                      </a>
                    )}
                    {profile.websiteUrl && (
                      <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer">
                        Website
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <h2 className="m-0 mb-4 font-display text-sm font-semibold uppercase tracking-wider text-(--color-text-muted)">
              Badges
            </h2>
            <PublicBadgeGrid badges={profile.badges} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className={cardClass}>
              <h2 className="m-0 mb-4 font-display text-sm font-semibold uppercase tracking-wider text-(--color-text-muted)">
                Solved
              </h2>
              <div className="flex flex-col gap-3">
                {DIFFICULTIES.map((difficulty) => (
                  <div key={difficulty.key} className="flex items-center justify-between text-sm">
                    <span className={`font-medium ${difficulty.tone}`}>{difficulty.label}</span>
                    <span className="tabular-nums">
                      {profile.stats.byDifficulty[difficulty.key]}
                    </span>
                  </div>
                ))}
                <div className="mt-1 flex items-center justify-between border-t border-(--color-border-subtle) pt-2 text-sm">
                  <span className="text-(--color-text-muted)">Total solved</span>
                  <span className="font-semibold tabular-nums">
                    {profile.stats.problemsSolved}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-(--color-text-muted)">Acceptance</span>
                  <span className="font-semibold tabular-nums">
                    {profile.stats.acceptanceRate}%
                  </span>
                </div>
              </div>
            </div>

            <div className={cardClass}>
              <h2 className="m-0 mb-4 font-display text-sm font-semibold uppercase tracking-wider text-(--color-text-muted)">
                Standing
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {tiles.map((tile) => {
                  const Icon = tile.icon;
                  return (
                    <div
                      key={tile.label}
                      className="flex items-center gap-3 rounded-md border border-(--color-border-subtle) bg-(--color-bg-soft) p-3"
                    >
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-(--radius-full) bg-(--color-accent-soft) text-(--color-accent)">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="font-display text-lg font-semibold leading-none">
                          {tile.value}
                        </div>
                        <div className="mt-1 text-[11px] text-(--color-text-muted)">
                          {tile.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <h2 className="m-0 mb-4 font-display text-sm font-semibold uppercase tracking-wider text-(--color-text-muted)">
              Activity
            </h2>
            <ContributionHeatmap cells={profile.heatmap} />
          </div>

          {profile.publicLists.length > 0 && (
            <div className={cardClass}>
              <h2 className="m-0 mb-4 font-display text-sm font-semibold uppercase tracking-wider text-(--color-text-muted)">
                Public lists
              </h2>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {profile.publicLists.map((list) => (
                  <li key={list.id}>
                    <Link
                      href={`/u/${profile.handle}/lists/${list.id}`}
                      className="flex items-center justify-between gap-3 rounded-md border border-(--color-border-subtle) bg-(--color-bg-soft) p-3 text-sm transition-colors hover:border-(--color-accent)"
                    >
                      <span className="font-medium">{list.name}</span>
                      <span className="text-(--color-text-muted)">{list.itemCount} problems</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
