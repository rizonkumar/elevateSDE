import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { seedProblems } from './seed-data/problems-seeder';
import { seedCommunity } from './seed-data/community-seeder';
import { seedBadges } from './seed-data/badges-seeder';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt();
  return bcrypt.hash(plain, salt);
}

const LEGACY_ADMIN_EMAIL = 'admin@elevatesde.dev';
const MIN_OWNER_PASSWORD_LENGTH = 8;

interface OwnerCredentials {
  email: string;
  password: string;
}

function readOwnerCredentials(): OwnerCredentials {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase() ?? '';
  const password = process.env.SEED_ADMIN_PASSWORD ?? '';
  if (!email || !email.includes('@')) {
    throw new Error('SEED_ADMIN_EMAIL must be set to the owner admin email in apps/api/.env');
  }
  if (password.length < MIN_OWNER_PASSWORD_LENGTH) {
    throw new Error(
      `SEED_ADMIN_PASSWORD must be set in apps/api/.env and be at least ${MIN_OWNER_PASSWORD_LENGTH} characters`,
    );
  }
  return { email, password };
}

async function seedOwnerAdmin(credentials: OwnerCredentials) {
  const passwordHash = await hashPassword(credentials.password);
  await prisma.user.deleteMany({
    where: { email: LEGACY_ADMIN_EMAIL, NOT: { email: credentials.email } },
  });
  return prisma.user.upsert({
    where: { email: credentials.email },
    update: { passwordHash, role: 'ADMIN' },
    create: { email: credentials.email, passwordHash, role: 'ADMIN' },
  });
}

async function seedDemoAccounts(adminId: string, adminEmail: string): Promise<void> {
  const password = await hashPassword('Password123!');

  const tenant = await prisma.tenant.upsert({
    where: { id: 'seed-tenant-acme' },
    update: {},
    create: {
      id: 'seed-tenant-acme',
      name: 'Acme Corp',
      subscriptionPlan: 'TEAM',
    },
  });

  await prisma.user.upsert({
    where: { email: 'candidate@elevatesde.dev' },
    update: { passwordHash: password, role: 'USER' },
    create: {
      email: 'candidate@elevatesde.dev',
      passwordHash: password,
      role: 'USER',
    },
  });

  await prisma.user.upsert({
    where: { email: 'org@elevatesde.dev' },
    update: { passwordHash: password, role: 'TENANT_ADMIN', tenantId: tenant.id },
    create: {
      email: 'org@elevatesde.dev',
      passwordHash: password,
      role: 'TENANT_ADMIN',
      tenantId: tenant.id,
    },
  });

  const memberEmails = [
    'maya.patel@acme.dev',
    'leo.nguyen@acme.dev',
    'sara.cohen@acme.dev',
    'devon.ruiz@acme.dev',
  ];

  for (const email of memberEmails) {
    await prisma.user.upsert({
      where: { email },
      update: { tenantId: tenant.id, role: 'USER' },
      create: { email, passwordHash: password, role: 'USER', tenantId: tenant.id },
    });
  }

  const auditActions = [
    { action: 'USER_REGISTERED', metadata: { email: 'candidate@elevatesde.dev', role: 'USER' } },
    { action: 'TENANT_CREATED', metadata: { name: 'Acme Corp', plan: 'TEAM' } },
    { action: 'FEATURE_FLAG_ENABLED', metadata: { flagKey: 'AI_MOCK_INTERVIEW_BETA' } },
    { action: 'ROLE_CHANGED', metadata: { from: 'USER', to: 'ADMIN', target: adminEmail } },
  ];

  for (const entry of auditActions) {
    await prisma.auditLog.create({
      data: { userId: adminId, action: entry.action, metadata: entry.metadata },
    });
  }

  const totalMembers = await seedCommunity(prisma, password);
  console.log(`Seeded community. Total roster members: ${totalMembers}`);
}

async function seedFeatureFlags(): Promise<void> {
  const flags = [
    { flagKey: 'AI_MOCK_INTERVIEW_BETA', isEnabled: true, percentageRollout: 100 },
    { flagKey: 'RESUME_ATS_SCORING', isEnabled: true, percentageRollout: 75 },
    { flagKey: 'CODE_EXECUTION_SANDBOX', isEnabled: true, percentageRollout: 100 },
    { flagKey: 'DISCUSSION_FORUMS', isEnabled: false, percentageRollout: 25 },
  ];

  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { flagKey: flag.flagKey },
      update: {},
      create: flag,
    });
  }
}

function shouldSeedDemoAccounts(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  return process.env.SEED_DEMO_ACCOUNTS === 'true';
}

async function main() {
  const owner = await seedOwnerAdmin(readOwnerCredentials());
  console.log('Seeded owner admin account.');

  await seedFeatureFlags();

  if (shouldSeedDemoAccounts()) {
    await seedDemoAccounts(owner.id, owner.email);
  }

  const totalProblems = await seedProblems(prisma);
  console.log(`Seeded coding problems. Total problems in database: ${totalProblems}`);

  const totalBadges = await seedBadges(prisma);
  console.log(`Seeded badges. Total badges in database: ${totalBadges}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
