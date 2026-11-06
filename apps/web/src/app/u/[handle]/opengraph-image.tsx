import { ImageResponse } from 'next/og';
import { fetchPublicProfile } from '@/lib/public-profile-server';
import { getNameInitials } from '@/lib/relative-time';

export const alt = 'ElevateSDE coding profile';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const INK = '#171717';
const MUTED = '#4d4d4d';
const ACCENT = '#006bff';
const ACCENT_SOFT = '#f0f7ff';
const BORDER = '#ebebeb';

interface ImageProps {
  params: Promise<{ handle: string }>;
}

function Stat({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 28px',
        border: `2px solid ${BORDER}`,
        borderRadius: 16,
        minWidth: 240,
      }}
    >
      <div style={{ fontSize: 44, fontWeight: 700, color: INK }}>{value}</div>
      <div style={{ fontSize: 22, color: MUTED, marginTop: 6 }}>{label}</div>
    </div>
  );
}

export default async function Image({ params }: ImageProps) {
  const { handle } = await params;
  const profile = await fetchPublicProfile(handle).catch(() => null);
  const displayName = profile?.displayName ?? 'ElevateSDE';
  const subtitle = profile ? `@${profile.handle}` : 'Interview prep for engineers';

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        background: '#ffffff',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            background: ACCENT,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          E
        </div>
        <div style={{ display: 'flex', fontSize: 30, fontWeight: 600, color: INK }}>
          Elevate<span style={{ color: ACCENT }}>SDE</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
        <div
          style={{
            width: 160,
            height: 160,
            borderRadius: 80,
            background: ACCENT_SOFT,
            color: ACCENT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 64,
            fontWeight: 700,
          }}
        >
          {getNameInitials(displayName)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 68, fontWeight: 700, color: INK, letterSpacing: -1 }}>
            {displayName}
          </div>
          <div style={{ fontSize: 32, color: MUTED, marginTop: 8 }}>{subtitle}</div>
        </div>
      </div>

      {profile ? (
        <div style={{ display: 'flex', gap: 24 }}>
          <Stat label="Problems solved" value={profile.solved.solved.toLocaleString('en-US')} />
          <Stat label="Points" value={profile.points.toLocaleString('en-US')} />
          <Stat label="Badges" value={String(profile.badges.length)} />
          {profile.rating ? (
            <Stat label="Contest rating" value={String(profile.rating.rating)} />
          ) : (
            <Stat label="Longest streak" value={`${profile.streak.longest}d`} />
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', fontSize: 28, color: MUTED }}>
          Practice. Compete. Get hired.
        </div>
      )}
    </div>,
    { ...size },
  );
}
