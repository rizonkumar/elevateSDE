import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { PublicProfileDto } from '@elevatesde/shared-types';
import { ContributionHeatmap } from '@/components/dashboard/profile/ContributionHeatmap';
import { ProfileBadgesCard } from '@/components/public-profile/ProfileBadgesCard';
import { ProfileHeaderCard } from '@/components/public-profile/ProfileHeaderCard';
import { ProfileStatGrid } from '@/components/public-profile/ProfileStatGrid';
import { RatingCard } from '@/components/contest-rating/RatingCard';
import { RecentSolvesCard } from '@/components/public-profile/RecentSolvesCard';
import { SectionCard } from '@/components/public-profile/SectionCard';
import { SolvedBreakdownCard } from '@/components/public-profile/SolvedBreakdownCard';
import { TopTopicsCard } from '@/components/public-profile/TopTopicsCard';
import { fetchPublicProfile } from '@/lib/public-profile-server';

interface PublicProfilePageProps {
  params: Promise<{ handle: string }>;
}

function describeProfile(profile: PublicProfileDto): string {
  const summary = `${profile.solved.solved} problems solved · ${profile.points.toLocaleString('en-US')} points · ${profile.badges.length} badges on ElevateSDE.`;
  const lead = profile.headline ?? profile.bio;
  return lead ? `${lead} — ${summary}` : summary;
}

export async function generateMetadata({ params }: PublicProfilePageProps): Promise<Metadata> {
  const { handle } = await params;
  const profile = await fetchPublicProfile(handle);
  if (!profile) {
    return { title: 'Profile not found · ElevateSDE', robots: { index: false } };
  }
  const title = `${profile.displayName} (@${profile.handle}) · ElevateSDE`;
  const description = describeProfile(profile);
  return {
    title,
    description,
    alternates: { canonical: `/u/${profile.handle}` },
    openGraph: { title, description, type: 'profile', username: profile.handle },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { handle } = await params;
  const profile = await fetchPublicProfile(handle);
  if (!profile) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-[1080px] flex-col gap-4 px-4 py-6 sm:gap-6 sm:px-6 sm:py-10 lg:px-8">
      <ProfileHeaderCard profile={profile} />
      <ProfileStatGrid profile={profile} />
      {profile.rating && <RatingCard summary={profile.rating} linkContests={false} />}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
        <SolvedBreakdownCard profile={profile} className="lg:col-span-3" />
        <TopTopicsCard topics={profile.topTopics} className="lg:col-span-2" />
      </div>
      <SectionCard title="Activity">
        <ContributionHeatmap cells={profile.heatmap} />
      </SectionCard>
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
        <ProfileBadgesCard badges={profile.badges} className="lg:col-span-3" />
        <RecentSolvesCard solves={profile.recentSolves} className="lg:col-span-2" />
      </div>
    </main>
  );
}
