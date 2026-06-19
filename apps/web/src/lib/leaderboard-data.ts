import type { LeaderboardEntryDto, LeaderboardTimeframe } from '@elevatesde/shared-types';

interface LeaderboardPersonSeed {
  userId: string;
  name: string;
  headline: string | null;
  badges: string[];
  isCurrentUser?: boolean;
}

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
  { userId: 'u-arjun', name: 'Arjun Mehta', headline: 'New grad, 2025', badges: [] },
  { userId: 'u-clara', name: 'Clara Dubois', headline: 'Product engineer', badges: [] },
  { userId: 'u-sam', name: 'Sam Reyes', headline: 'Switching to SWE', badges: ['Fast Learner'] },
  { userId: 'u-hiro', name: 'Hiro Sato', headline: 'Embedded systems', badges: [] },
  { userId: 'u-elena', name: 'Elena Popa', headline: 'Cloud engineer', badges: ['Helpful'] },
  { userId: 'u-bilal', name: 'Bilal Aziz', headline: 'New grad, 2026', badges: [] },
  { userId: 'u-rosa', name: 'Rosa Martinez', headline: 'QA to SDET', badges: [] },
  { userId: 'u-finn', name: 'Finn OBrien', headline: 'Backend, 2 yrs', badges: [] },
  { userId: 'u-amara', name: 'Amara Diallo', headline: 'Platform, 4 yrs', badges: ['Consistent'] },
  { userId: 'u-victor', name: 'Victor Lindqvist', headline: 'Data platform', badges: [] },
];

const TIMEFRAME_FACTOR: Record<LeaderboardTimeframe, number> = {
  'all-time': 1,
  monthly: 0.34,
  weekly: 0.11,
};

function buildEntries(timeframe: LeaderboardTimeframe): LeaderboardEntryDto[] {
  const factor = TIMEFRAME_FACTOR[timeframe];
  return PEOPLE.map((person, index) => {
    const basePoints = 4820 - index * 138 - (index % 4) * 23;
    const points = Math.max(40, Math.round(basePoints * factor));
    const assessmentsCompleted = Math.max(1, Math.round((68 - index * 2) * factor));
    const streakDays = Math.max(0, 41 - index - (index % 3) * 2);
    return {
      rank: index + 1,
      userId: person.userId,
      name: person.name,
      headline: person.headline,
      points,
      assessmentsCompleted,
      badges: person.badges,
      streakDays,
      isCurrentUser: person.isCurrentUser ?? false,
    };
  });
}

const ENTRIES_BY_TIMEFRAME: Record<LeaderboardTimeframe, LeaderboardEntryDto[]> = {
  'all-time': buildEntries('all-time'),
  monthly: buildEntries('monthly'),
  weekly: buildEntries('weekly'),
};

export function getLeaderboardEntries(timeframe: LeaderboardTimeframe): LeaderboardEntryDto[] {
  return ENTRIES_BY_TIMEFRAME[timeframe];
}
