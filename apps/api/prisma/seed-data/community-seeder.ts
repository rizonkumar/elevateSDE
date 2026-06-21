import { Prisma, PrismaClient } from '@prisma/client';

interface RosterMember {
  id: string;
  name: string;
  headline: string;
  badges: string[];
}

interface SeedComment {
  id: string;
  authorId: string;
  body: string;
  upvoters: number;
}

interface SeedReport {
  reporterId: string;
  reason: string;
}

interface SeedPost {
  id: string;
  authorId: string;
  title: string;
  body: string;
  tags: string[];
  status: 'PUBLISHED' | 'FLAGGED' | 'REMOVED';
  viewCount: number;
  upvoters: number;
  comments: SeedComment[];
  reports: SeedReport[];
}

const ROSTER: RosterMember[] = [
  {
    id: 'u-kenji',
    name: 'Kenji Watanabe',
    headline: 'Distributed systems',
    badges: ['Top Mentor', 'System Design'],
  },
  {
    id: 'u-priya',
    name: 'Priya Nair',
    headline: 'SDE II @ fintech',
    badges: ['DSA Streak', 'Helpful'],
  },
  { id: 'u-raj', name: 'Raj Patel', headline: 'Staff candidate', badges: ['System Design'] },
  { id: 'u-sofia', name: 'Sofia Bianchi', headline: 'Frontend specialist', badges: ['Resume Pro'] },
  { id: 'u-aisha', name: 'Aisha Rahman', headline: 'Senior Engineer', badges: ['Top Mentor'] },
  {
    id: 'u-daniel',
    name: 'Daniel Okoro',
    headline: 'Backend @ healthtech',
    badges: ['DSA Streak'],
  },
  { id: 'u-marco', name: 'Marco Velasquez', headline: 'New grad, 2025', badges: ['Fast Learner'] },
  { id: 'u-lena', name: 'Lena Fischer', headline: 'Switching from QA', badges: ['Consistent'] },
  { id: 'u-omar', name: 'Omar Haddad', headline: 'Mobile engineer', badges: [] },
  { id: 'u-yuki', name: 'Yuki Tanaka', headline: 'Platform engineer', badges: ['Helpful'] },
  { id: 'u-grace', name: 'Grace Liu', headline: 'ML engineer', badges: ['DSA Streak'] },
  { id: 'u-noah', name: 'Noah Schmidt', headline: 'New grad, 2026', badges: [] },
  { id: 'u-fatima', name: 'Fatima Zahra', headline: 'Security engineer', badges: ['Consistent'] },
  { id: 'u-leo', name: 'Leo Costa', headline: 'Data engineer', badges: [] },
  { id: 'u-mei', name: 'Mei Chen', headline: 'Full stack', badges: ['Resume Pro'] },
  { id: 'u-ivan', name: 'Ivan Petrov', headline: 'Infra @ gaming', badges: [] },
  { id: 'u-zara', name: 'Zara Khan', headline: 'Frontend, 3 yrs', badges: ['Helpful'] },
  { id: 'u-tom', name: 'Tom Andersen', headline: 'Backend, 5 yrs', badges: [] },
  { id: 'u-nina', name: 'Nina Volkova', headline: 'SRE candidate', badges: ['Consistent'] },
  { id: 'u-arjun', name: 'Arjun Mehta', headline: 'New grad, 2025', badges: [] },
  { id: 'u-clara', name: 'Clara Dubois', headline: 'Product engineer', badges: [] },
  { id: 'u-sam', name: 'Sam Reyes', headline: 'Switching to SWE', badges: ['Fast Learner'] },
  { id: 'u-hiro', name: 'Hiro Sato', headline: 'Embedded systems', badges: [] },
  { id: 'u-elena', name: 'Elena Popa', headline: 'Cloud engineer', badges: ['Helpful'] },
  { id: 'u-bilal', name: 'Bilal Aziz', headline: 'New grad, 2026', badges: [] },
  { id: 'u-rosa', name: 'Rosa Martinez', headline: 'QA to SDET', badges: [] },
  { id: 'u-finn', name: 'Finn OBrien', headline: 'Backend, 2 yrs', badges: [] },
  { id: 'u-amara', name: 'Amara Diallo', headline: 'Platform, 4 yrs', badges: ['Consistent'] },
  { id: 'u-victor', name: 'Victor Lindqvist', headline: 'Data platform', badges: [] },
];

const POSTS: SeedPost[] = [
  {
    id: 'seed-post-rate-limiter',
    authorId: 'u-kenji',
    title: 'How would you design a distributed rate limiter for a public API?',
    body: 'Got this in a final round. I went with a token bucket per client in Redis, but the interviewer kept pushing on what happens when a Redis node fails. How do you keep limits consistent without making every request a synchronous cross-region call?',
    tags: ['system-design', 'faang'],
    status: 'PUBLISHED',
    viewCount: 2140,
    upvoters: 18,
    reports: [],
    comments: [
      {
        id: 'seed-comment-rl-1',
        authorId: 'u-raj',
        body: 'I would not make limits strongly consistent. Use local token buckets per node with periodic reconciliation. A small amount of over-admission on failover is almost always acceptable for a rate limiter.',
        upvoters: 9,
      },
      {
        id: 'seed-comment-rl-2',
        authorId: 'u-priya',
        body: 'Redis Cluster with a replica per shard plus a sliding-window-counter script handled the consistency question for me. Mention degradation: if Redis is down, fail open, not closed.',
        upvoters: 6,
      },
    ],
  },
  {
    id: 'seed-post-dp-patterns',
    authorId: 'u-priya',
    title: 'A short list of DP patterns that cover ~90% of interview questions',
    body: '0/1 knapsack, unbounded knapsack, longest common subsequence, longest increasing subsequence, matrix-path, interval DP, and bitmask DP. Map a new problem to one of these before writing code. What would you add?',
    tags: ['leetcode'],
    status: 'PUBLISHED',
    viewCount: 3210,
    upvoters: 24,
    reports: [],
    comments: [
      {
        id: 'seed-comment-dp-1',
        authorId: 'u-kenji',
        body: 'Add "digit DP" for counting problems with constraints on the number itself. Rare, but it shows up at the harder end.',
        upvoters: 5,
      },
    ],
  },
  {
    id: 'seed-post-resume-bullets',
    authorId: 'u-sofia',
    title: 'Rewrote my resume bullets to lead with impact and got 3x more callbacks',
    body: 'Old: "Responsible for the payments service." New: "Cut payment failure rate 38% by adding idempotent retries, recovering ~$1.2M/yr." Quantify everything. Happy to review a few if people paste theirs.',
    tags: ['resume'],
    status: 'PUBLISHED',
    viewCount: 2890,
    upvoters: 21,
    reports: [],
    comments: [],
  },
  {
    id: 'seed-post-news-feed',
    authorId: 'u-raj',
    title: 'Designing a news feed: pull vs push vs hybrid fan-out',
    body: 'For a feed with celebrity accounts (millions of followers), pure push fan-out on write explodes. The hybrid approach pushes for normal users and pulls for celebrities at read time. How do you decide the follower threshold?',
    tags: ['system-design'],
    status: 'PUBLISHED',
    viewCount: 1875,
    upvoters: 14,
    reports: [],
    comments: [],
  },
  {
    id: 'seed-post-offer-comparison',
    authorId: 'u-lena',
    title: 'Two offers: larger base vs more equity at an earlier-stage startup',
    body: 'Offer A is a big-tech L4 with a strong base and predictable RSUs. Offer B is a Series B startup, lower base but a meaningful equity grant. Both remote. How are people thinking about risk-adjusting the equity here?',
    tags: ['offers', 'startups'],
    status: 'PUBLISHED',
    viewCount: 1188,
    upvoters: 9,
    reports: [],
    comments: [],
  },
  {
    id: 'seed-post-behavioral-failure',
    authorId: 'u-aisha',
    title: 'Best framework for the "tell me about a time you failed" question?',
    body: 'STAR feels mechanical when I use it for failure stories. The strongest answers I have heard focus on what changed afterward. What structure has actually worked for you in senior loops?',
    tags: ['behavioral'],
    status: 'PUBLISHED',
    viewCount: 902,
    upvoters: 7,
    reports: [],
    comments: [],
  },
  {
    id: 'seed-post-cold-email',
    authorId: 'u-sofia',
    title: 'A cold email template that got me 4 referrals out of 10 sends',
    body: 'Short, specific, and easy to say yes to: who I am, one line on why their team, the exact role/req ID, and an attached resume so they can forward it in one click. Make the ask trivial to fulfill.',
    tags: ['referrals', 'resume'],
    status: 'PUBLISHED',
    viewCount: 2410,
    upvoters: 16,
    reports: [],
    comments: [],
  },
  {
    id: 'seed-post-recruiter-spam',
    authorId: 'u-marco',
    title: 'DM me for guaranteed FAANG referrals — fast process, limited slots',
    body: 'I can get your resume to the top of the pile at several big companies for a small fee. Serious candidates only. Reply here or message me directly to reserve a slot this week.',
    tags: ['referrals'],
    status: 'FLAGGED',
    viewCount: 410,
    upvoters: 1,
    reports: [
      { reporterId: 'u-priya', reason: 'Paid referral solicitation, looks like a scam.' },
      { reporterId: 'u-raj', reason: 'Spam / self-promotion against community rules.' },
    ],
    comments: [],
  },
  {
    id: 'seed-post-removed-pii',
    authorId: 'u-daniel',
    title: 'Here is the recruiter list with names, phone numbers, and emails',
    body: 'Sharing a spreadsheet of internal recruiter contacts I collected. Includes direct phone numbers and personal emails so you can skip the application portal entirely.',
    tags: ['referrals'],
    status: 'REMOVED',
    viewCount: 638,
    upvoters: 0,
    reports: [
      { reporterId: 'u-aisha', reason: 'Leaks personal contact information (PII).' },
      { reporterId: 'u-sofia', reason: 'Privacy violation, should be removed.' },
      { reporterId: 'u-kenji', reason: 'Sharing private data without consent.' },
    ],
    comments: [],
  },
];

export async function seedCommunity(prisma: PrismaClient, passwordHash: string): Promise<number> {
  for (let index = 0; index < ROSTER.length; index += 1) {
    const member = ROSTER[index];
    if (!member) {
      continue;
    }
    const { firstName, lastName } = splitName(member.name);
    const email = toEmail(member.name);
    await prisma.user.upsert({
      where: { id: member.id },
      update: { headline: member.headline, firstName, lastName },
      create: {
        id: member.id,
        email,
        passwordHash,
        role: 'USER',
        firstName,
        lastName,
        headline: member.headline,
      },
    });

    const stats = buildStats(index, member.badges);
    await prisma.userStats.upsert({
      where: { userId: member.id },
      update: stats,
      create: { userId: member.id, ...stats },
    });
  }

  await seedCandidateStats(prisma);

  const postIds = POSTS.map((post) => post.id);
  await prisma.forumReport.deleteMany({ where: { postId: { in: postIds } } });
  await prisma.forumPostVote.deleteMany({ where: { postId: { in: postIds } } });
  const commentIds = POSTS.flatMap((post) => post.comments.map((comment) => comment.id));
  await prisma.forumCommentVote.deleteMany({ where: { commentId: { in: commentIds } } });

  for (const post of POSTS) {
    await prisma.forumPost.upsert({
      where: { id: post.id },
      update: {
        title: post.title,
        body: post.body,
        tags: post.tags,
        status: post.status,
        viewCount: post.viewCount,
      },
      create: {
        id: post.id,
        userId: post.authorId,
        title: post.title,
        body: post.body,
        tags: post.tags,
        status: post.status,
        viewCount: post.viewCount,
      },
    });

    for (const comment of post.comments) {
      await prisma.forumComment.upsert({
        where: { id: comment.id },
        update: { body: comment.body },
        create: {
          id: comment.id,
          postId: post.id,
          userId: comment.authorId,
          body: comment.body,
        },
      });
    }

    const postVotes = pickVoters(post.upvoters, post.authorId).map((userId) => ({
      postId: post.id,
      userId,
    }));
    if (postVotes.length > 0) {
      await prisma.forumPostVote.createMany({ data: postVotes, skipDuplicates: true });
    }

    for (const comment of post.comments) {
      const commentVotes = pickVoters(comment.upvoters, comment.authorId).map((userId) => ({
        commentId: comment.id,
        userId,
      }));
      if (commentVotes.length > 0) {
        await prisma.forumCommentVote.createMany({ data: commentVotes, skipDuplicates: true });
      }
    }

    const reportRows: Prisma.ForumReportCreateManyInput[] = post.reports.map((report) => ({
      postId: post.id,
      reporterId: report.reporterId,
      reason: report.reason,
    }));
    if (reportRows.length > 0) {
      await prisma.forumReport.createMany({ data: reportRows });
    }
  }

  return ROSTER.length;
}

async function seedCandidateStats(prisma: PrismaClient): Promise<void> {
  const candidate = await prisma.user.findUnique({ where: { email: 'candidate@elevatesde.dev' } });
  if (!candidate) {
    return;
  }
  await prisma.user.update({
    where: { id: candidate.id },
    data: {
      headline: candidate.headline ?? 'Preparing for interviews',
      firstName: candidate.firstName ?? 'Alex',
      lastName: candidate.lastName ?? 'Candidate',
    },
  });
  const stats = {
    points: 2480,
    monthlyPoints: 840,
    weeklyPoints: 270,
    assessmentsCompleted: 34,
    badges: ['Rising Star'],
    streakDays: 12,
  };
  await prisma.userStats.upsert({
    where: { userId: candidate.id },
    update: stats,
    create: { userId: candidate.id, ...stats },
  });
}

function buildStats(
  index: number,
  badges: string[],
): {
  points: number;
  monthlyPoints: number;
  weeklyPoints: number;
  assessmentsCompleted: number;
  badges: string[];
  streakDays: number;
} {
  const basePoints = 4820 - index * 138 - (index % 4) * 23;
  return {
    points: Math.max(120, basePoints),
    monthlyPoints: Math.max(40, Math.round(basePoints * 0.34)),
    weeklyPoints: Math.max(15, Math.round(basePoints * 0.11)),
    assessmentsCompleted: Math.max(1, 68 - index * 2),
    badges,
    streakDays: Math.max(0, 41 - index - (index % 3) * 2),
  };
}

function pickVoters(count: number, authorId: string): string[] {
  const voters: string[] = [];
  for (const member of ROSTER) {
    if (voters.length >= count) {
      break;
    }
    if (member.id !== authorId) {
      voters.push(member.id);
    }
  }
  return voters;
}

function splitName(name: string): { firstName: string; lastName: string | null } {
  const parts = name.trim().split(/\s+/);
  const firstName = parts[0] ?? name;
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : null;
  return { firstName, lastName };
}

function toEmail(name: string): string {
  const handle = name
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .trim()
    .split(/\s+/)
    .join('.');
  return `${handle}@community.dev`;
}
