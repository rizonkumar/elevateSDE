import { BadgeCriteriaType, PrismaClient } from '@prisma/client';

interface SeedBadge {
  key: string;
  name: string;
  description: string;
  icon: string;
  criteriaType: BadgeCriteriaType;
  threshold: number;
}

const BADGES: SeedBadge[] = [
  {
    key: 'first-blood',
    name: 'First Blood',
    description: 'Solve your very first problem.',
    icon: 'Swords',
    criteriaType: 'PROBLEMS_SOLVED',
    threshold: 1,
  },
  {
    key: 'getting-started',
    name: 'Getting Started',
    description: 'Solve ten problems.',
    icon: 'Rocket',
    criteriaType: 'PROBLEMS_SOLVED',
    threshold: 10,
  },
  {
    key: 'week-warrior',
    name: 'Week Warrior',
    description: 'Reach a seven day solving streak.',
    icon: 'Flame',
    criteriaType: 'STREAK_DAYS',
    threshold: 7,
  },
  {
    key: 'assessor',
    name: 'Assessor',
    description: 'Complete five assessments.',
    icon: 'ClipboardCheck',
    criteriaType: 'ASSESSMENTS_COMPLETED',
    threshold: 5,
  },
  {
    key: 'community-voice',
    name: 'Community Voice',
    description: 'Publish your first forum post.',
    icon: 'MessagesSquare',
    criteriaType: 'FORUM_POSTS',
    threshold: 1,
  },
  {
    key: 'point-collector',
    name: 'Point Collector',
    description: 'Earn one thousand points.',
    icon: 'Trophy',
    criteriaType: 'POINTS',
    threshold: 1000,
  },
];

export async function seedBadges(prisma: PrismaClient): Promise<number> {
  for (const badge of BADGES) {
    await prisma.badge.upsert({
      where: { key: badge.key },
      update: {
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        criteriaType: badge.criteriaType,
        threshold: badge.threshold,
        isActive: true,
      },
      create: { ...badge, isActive: true },
    });
  }
  return prisma.badge.count();
}
