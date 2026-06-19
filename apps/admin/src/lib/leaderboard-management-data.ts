import type { LeaderboardEntryDto } from '@elevatesde/shared-types';

interface LeaderboardPersonSeed {
  userId: string;
  name: string;
  headline: string | null;
  badges: string[];
  isCurrentUser?: boolean;
}

export const BADGE_KEYS: string[] = [
  'Top Mentor',
  'System Design',
  'DSA Streak',
  'Helpful',
  'Resume Pro',
  'Rising Star',
  'Fast Learner',
  'Consistent',
];

const PEOPLE: LeaderboardPersonSeed[] = [
  { userId: 'u-kenji', name: 'Kenji Watanabe', headline: 'Distributed systems', badges: ['Top Mentor', 'System Design'] },
  { userId: 'u-priya', name: 'Priya Nair', headline: 'SDE II @ fintech', badges: ['DSA Streak', 'Helpful'] },
  { userId: 'u-raj', name: 'Raj Patel', headline: 'Staff candidate', badges: ['System Design'] },
  { userId: 'u-sofia', name: 'Sofia Bianchi', headline: 'Frontend specialist', badges: ['Resume Pro'] },
  { userId: 'u-aisha', name: 'Aisha Rahman', headline: 'Senior Engineer', badges: ['Top Mentor'] },
  { userId: 'u-daniel', name: 'Daniel Okoro', headline: 'Backend @ healthtech', badges: ['DSA Streak'] },
  { userId: 'u-you', name: 'You', headline: 'Your standing', badges: ['Rising Star'], isCurrentUser: true },
  { userId: 'u-marco', name: 'Marco Velasquez', headline: 'New grad, 2025', badges: ['Fast Learner'] },
  { userId: 'u-lena', name: 'Lena Fischer', headline: 'Switching from QA', badges: ['Consistent'] },
  { userId: 'u-omar', name: 'Omar Haddad', headline: 'Mobile engineer', badges: [] },
  { userId: 'u-yuki', name: 'Yuki Tanaka', headline: 'Platform engineer', badges: ['Helpful'] },
  { userId: 'u-grace', name: 'Grace Liu', headline: 'ML engineer', badges: ['DSA Streak'] },
  { userId: 'u-noah', name: 'Noah Schmidt', headline: 'New grad, 2026', badges: [] },
  { userId: 'u-fatima', name: 'Fatima Zahra', headline: 'Security engineer', badges: ['Consistent'] },
  { userId: 'u-leo', name: 'Leo Costa', headline: 'Data engineer', badges: [] },
  { userId: 'u-mei', name: 'Mei Chen', headline: 'Full stack', badges: ['Resume Pro'] },
  { userId: 'u-ivan', name: 'Ivan Petrov', headline: 'Infra @ gaming', badges: [] },
  { userId: 'u-zara', name: 'Zara Khan', headline: 'Frontend, 3 yrs', badges: ['Helpful'] },
  { userId: 'u-tom', name: 'Tom Andersen', headline: 'Backend, 5 yrs', badges: [] },
  { userId: 'u-nina', name: 'Nina Volkova', headline: 'SRE candidate', badges: ['Consistent'] },
];

function buildStandings(): LeaderboardEntryDto[] {
  return PEOPLE.map((person, index) => {
    const basePoints = 4820 - index * 138 - (index % 4) * 23;
    return {
      rank: index + 1,
      userId: person.userId,
      name: person.name,
      headline: person.headline,
      points: Math.max(40, basePoints),
      assessmentsCompleted: Math.max(1, 68 - index * 2),
      badges: person.badges,
      streakDays: Math.max(0, 41 - index - (index % 3) * 2),
      isCurrentUser: person.isCurrentUser ?? false,
    };
  });
}

const NETWORK_DELAY = 280;

export function getStandings(): Promise<LeaderboardEntryDto[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(buildStandings()), NETWORK_DELAY);
  });
}
