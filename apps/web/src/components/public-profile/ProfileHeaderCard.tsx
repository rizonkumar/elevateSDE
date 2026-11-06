import { Building2, CalendarDays, Globe, MapPin } from 'lucide-react';
import type { PublicProfileDto } from '@elevatesde/shared-types';
import { getNameInitials } from '@/lib/relative-time';
import { GitHubIcon, LinkedInIcon } from './BrandIcons';
import { CopyProfileLinkButton } from './CopyProfileLinkButton';
import { publicProfilePath } from './ProfileNameLink';

interface ProfileHeaderCardProps {
  profile: PublicProfileDto;
}

interface ProfileLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function joinedLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function profileLinks(profile: PublicProfileDto): ProfileLink[] {
  const links: ProfileLink[] = [];
  if (profile.links.github) {
    links.push({
      href: profile.links.github,
      label: 'GitHub',
      icon: <GitHubIcon className="h-4 w-4" />,
    });
  }
  if (profile.links.linkedin) {
    links.push({
      href: profile.links.linkedin,
      label: 'LinkedIn',
      icon: <LinkedInIcon className="h-4 w-4" />,
    });
  }
  if (profile.links.website) {
    links.push({
      href: profile.links.website,
      label: 'Website',
      icon: <Globe className="h-4 w-4" />,
    });
  }
  return links;
}

export function ProfileHeaderCard({ profile }: Readonly<ProfileHeaderCardProps>) {
  const links = profileLinks(profile);
  return (
    <section className="rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-5 shadow-(--shadow-card) sm:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <span
            aria-hidden="true"
            className="inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-(--radius-full) border border-(--color-border-subtle) bg-(--color-accent-soft) font-display text-2xl font-semibold text-(--color-accent) sm:h-24 sm:w-24 sm:text-3xl"
          >
            {getNameInitials(profile.displayName)}
          </span>
          <div className="min-w-0">
            <h1 className="m-0 font-display text-2xl font-semibold tracking-tight text-(--color-text-primary) sm:text-3xl">
              {profile.displayName}
            </h1>
            <p className="mt-1 mb-0 font-mono text-sm text-(--color-text-muted)">
              @{profile.handle}
            </p>
            {profile.headline && (
              <p className="mt-3 mb-0 text-base font-medium text-(--color-text-primary)">
                {profile.headline}
              </p>
            )}
            {profile.bio && (
              <p className="mt-2 mb-0 max-w-prose text-sm leading-relaxed text-(--color-text-muted)">
                {profile.bio}
              </p>
            )}
            <ul className="m-0 mt-4 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-sm text-(--color-text-muted)">
              {profile.location && (
                <li className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {profile.location}
                </li>
              )}
              {profile.organizationName && (
                <li className="inline-flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 shrink-0" />
                  {profile.organizationName}
                </li>
              )}
              <li className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 shrink-0" />
                Joined {joinedLabel(profile.joinedAt)}
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:justify-end">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              aria-label={`${link.label} profile`}
              title={link.label}
              className="inline-flex h-9 w-9 items-center justify-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-bg) text-(--color-text-primary) transition-colors hover:bg-(--color-badge-bg) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
            >
              {link.icon}
            </a>
          ))}
          <CopyProfileLinkButton path={publicProfilePath(profile.handle)} />
        </div>
      </div>
    </section>
  );
}
