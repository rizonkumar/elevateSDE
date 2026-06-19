import type {
  AdminForumPostDto,
  ForumAuthor,
  ForumCommentDto,
} from '@elevatesde/shared-types';

export interface ForumTag {
  id: string;
  label: string;
}

export const FORUM_TAGS: ForumTag[] = [
  { id: 'system-design', label: 'System Design' },
  { id: 'leetcode', label: 'LeetCode' },
  { id: 'behavioral', label: 'Behavioral' },
  { id: 'offers', label: 'Offers' },
  { id: 'referrals', label: 'Referrals' },
  { id: 'faang', label: 'FAANG' },
  { id: 'startups', label: 'Startups' },
  { id: 'resume', label: 'Resume' },
];

export function getTagLabel(id: string): string {
  return FORUM_TAGS.find((tag) => tag.id === id)?.label ?? id;
}

const AUTHORS = {
  priya: { id: 'u-priya', name: 'Priya Nair', headline: 'SDE II @ fintech' },
  marco: { id: 'u-marco', name: 'Marco Velasquez', headline: 'New grad, 2025' },
  aisha: { id: 'u-aisha', name: 'Aisha Rahman', headline: 'Senior Engineer' },
  daniel: { id: 'u-daniel', name: 'Daniel Okoro', headline: 'Backend @ healthtech' },
  lena: { id: 'u-lena', name: 'Lena Fischer', headline: 'Switching from QA' },
  raj: { id: 'u-raj', name: 'Raj Patel', headline: 'Staff candidate' },
  sofia: { id: 'u-sofia', name: 'Sofia Bianchi', headline: 'Frontend specialist' },
  kenji: { id: 'u-kenji', name: 'Kenji Watanabe', headline: 'Distributed systems' },
} satisfies Record<string, ForumAuthor>;

const AUTHOR_EMAILS: Record<string, string> = {
  'u-priya': 'priya.nair@gmail.com',
  'u-marco': 'marco.velasquez@outlook.com',
  'u-aisha': 'aisha.rahman@proton.me',
  'u-daniel': 'daniel.okoro@gmail.com',
  'u-lena': 'lena.fischer@gmail.com',
  'u-raj': 'raj.patel@yahoo.com',
  'u-sofia': 'sofia.bianchi@gmail.com',
  'u-kenji': 'kenji.watanabe@gmail.com',
};

function emailFor(author: ForumAuthor): string {
  return AUTHOR_EMAILS[author.id] ?? `${author.id}@elevatesde.dev`;
}

const POSTS_SEED: AdminForumPostDto[] = [
  {
    id: 'post-rate-limiter',
    title: 'How would you design a distributed rate limiter for a public API?',
    body: 'Got this in a final round. I went with a token bucket per client in Redis, but the interviewer kept pushing on what happens when a Redis node fails. How do you keep limits consistent without making every request a synchronous cross-region call?',
    tags: ['system-design', 'faang'],
    author: AUTHORS.kenji,
    authorEmail: emailFor(AUTHORS.kenji),
    status: 'PUBLISHED',
    upvotes: 142,
    replyCount: 3,
    viewCount: 2140,
    reportCount: 0,
    reports: [],
    createdAt: '2026-06-19T07:40:00.000Z',
  },
  {
    id: 'post-two-pointer-intuition',
    title: 'Finally understood when to reach for two pointers vs sliding window',
    body: 'Sharing the mental model that clicked for me after ~80 problems: sliding window is two pointers where the window is contiguous and you maintain an invariant. If the answer is a subarray/substring, start there. Curious how others frame it.',
    tags: ['leetcode'],
    author: AUTHORS.marco,
    authorEmail: emailFor(AUTHORS.marco),
    status: 'PUBLISHED',
    upvotes: 98,
    replyCount: 2,
    viewCount: 1503,
    reportCount: 0,
    reports: [],
    createdAt: '2026-06-19T05:10:00.000Z',
  },
  {
    id: 'post-recruiter-spam',
    title: 'Guaranteed FAANG offer in 30 days — DM me for the referral pack 🚀',
    body: 'Limited slots. I sell a referral bundle plus leaked OA questions for the top companies. Pay once and skip the grind. Drop your email below and I will reach out with pricing.',
    tags: ['referrals', 'offers'],
    author: AUTHORS.lena,
    authorEmail: emailFor(AUTHORS.lena),
    status: 'FLAGGED',
    upvotes: 4,
    replyCount: 1,
    viewCount: 311,
    reportCount: 5,
    reports: [
      { id: 'rep-spam-1', reason: 'Spam / selling paid referrals', createdAt: '2026-06-19T08:05:00.000Z' },
      { id: 'rep-spam-2', reason: 'Sharing leaked assessment content', createdAt: '2026-06-19T08:20:00.000Z' },
      { id: 'rep-spam-3', reason: 'Solicitation of personal contact details', createdAt: '2026-06-19T09:02:00.000Z' },
    ],
    createdAt: '2026-06-19T03:30:00.000Z',
  },
  {
    id: 'post-offer-comparison',
    title: 'Mid-level offer comparison: cash-heavy startup vs equity-heavy scale-up',
    body: 'Two offers on the table. One is base-heavy at a Series A, the other leans on RSUs at a public scale-up. How are folks weighing liquid comp now versus equity upside in this market?',
    tags: ['offers', 'startups'],
    author: AUTHORS.priya,
    authorEmail: emailFor(AUTHORS.priya),
    status: 'PUBLISHED',
    upvotes: 76,
    replyCount: 4,
    viewCount: 1188,
    reportCount: 0,
    reports: [],
    createdAt: '2026-06-18T18:45:00.000Z',
  },
  {
    id: 'post-behavioral-star',
    title: 'STAR answers feel robotic — how do you keep them natural?',
    body: 'Every time I prep behavioral stories with STAR they come out scripted. Interviewers seem to notice. How do you keep the structure without sounding rehearsed?',
    tags: ['behavioral'],
    author: AUTHORS.sofia,
    authorEmail: emailFor(AUTHORS.sofia),
    status: 'PUBLISHED',
    upvotes: 54,
    replyCount: 2,
    viewCount: 902,
    reportCount: 0,
    reports: [],
    createdAt: '2026-06-18T14:10:00.000Z',
  },
  {
    id: 'post-resume-rewrite',
    title: 'Rewrote my resume around impact metrics — ATS score jumped 22 points',
    body: 'Swapped responsibility bullets for outcome bullets with numbers. Sharing the before/after so others can sanity-check the format. Happy to trade reviews.',
    tags: ['resume'],
    author: AUTHORS.daniel,
    authorEmail: emailFor(AUTHORS.daniel),
    status: 'PUBLISHED',
    upvotes: 61,
    replyCount: 3,
    viewCount: 1044,
    reportCount: 0,
    reports: [],
    createdAt: '2026-06-18T09:25:00.000Z',
  },
  {
    id: 'post-flame-war',
    title: 'Anyone still using LeetCode is wasting their time, change my mind',
    body: 'Honestly if you grind LeetCode you are just bad at real engineering. The whole community here is delusional and the mods are clueless for allowing this nonsense.',
    tags: ['leetcode'],
    author: AUTHORS.raj,
    authorEmail: emailFor(AUTHORS.raj),
    status: 'FLAGGED',
    upvotes: 9,
    replyCount: 6,
    viewCount: 720,
    reportCount: 3,
    reports: [
      { id: 'rep-flame-1', reason: 'Harassment toward other members', createdAt: '2026-06-18T20:15:00.000Z' },
      { id: 'rep-flame-2', reason: 'Inflammatory / not constructive', createdAt: '2026-06-18T21:40:00.000Z' },
    ],
    createdAt: '2026-06-18T07:50:00.000Z',
  },
  {
    id: 'post-removed-pii',
    title: 'Dump of interviewer names and direct phone numbers at a big tech firm',
    body: 'Posting a list of recruiter and interviewer personal contacts so people can reach out directly. [content removed by moderation]',
    tags: ['faang', 'referrals'],
    author: AUTHORS.aisha,
    authorEmail: emailFor(AUTHORS.aisha),
    status: 'REMOVED',
    upvotes: 2,
    replyCount: 0,
    viewCount: 156,
    reportCount: 8,
    reports: [
      { id: 'rep-pii-1', reason: 'Exposing personal information (PII)', createdAt: '2026-06-17T11:05:00.000Z' },
      { id: 'rep-pii-2', reason: 'Privacy violation', createdAt: '2026-06-17T11:30:00.000Z' },
    ],
    createdAt: '2026-06-17T10:40:00.000Z',
  },
];

const COMMENTS_SEED: Record<string, ForumCommentDto[]> = {
  'post-rate-limiter': [
    {
      id: 'c-rl-1',
      postId: 'post-rate-limiter',
      author: AUTHORS.raj,
      body: 'Lean on a local token bucket with async replication to Redis. Accept brief over-allowance on failover rather than a synchronous cross-region hop.',
      upvotes: 31,
      hasUpvoted: false,
      createdAt: '2026-06-19T08:10:00.000Z',
    },
    {
      id: 'c-rl-2',
      postId: 'post-rate-limiter',
      author: AUTHORS.priya,
      body: 'We sharded buckets by client and used Redis Cluster with read replicas. The interviewer probably wanted you to name the CAP trade-off explicitly.',
      upvotes: 18,
      hasUpvoted: false,
      createdAt: '2026-06-19T08:35:00.000Z',
    },
  ],
  'post-recruiter-spam': [
    {
      id: 'c-spam-1',
      postId: 'post-recruiter-spam',
      author: AUTHORS.marco,
      body: 'This is a scam, please do not share your email here.',
      upvotes: 22,
      hasUpvoted: false,
      createdAt: '2026-06-19T07:00:00.000Z',
    },
  ],
  'post-flame-war': [
    {
      id: 'c-flame-1',
      postId: 'post-flame-war',
      author: AUTHORS.sofia,
      body: 'Disagreeing is fine but the tone here is just hostile.',
      upvotes: 14,
      hasUpvoted: false,
      createdAt: '2026-06-18T20:05:00.000Z',
    },
  ],
};

const NETWORK_DELAY = 280;

export function getModerationPosts(): Promise<AdminForumPostDto[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(POSTS_SEED.map((post) => ({ ...post }))), NETWORK_DELAY);
  });
}

export function getPostComments(postId: string): Promise<ForumCommentDto[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve((COMMENTS_SEED[postId] ?? []).map((comment) => ({ ...comment }))), NETWORK_DELAY);
  });
}
