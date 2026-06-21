import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { seedProblems } from './seed-data/problems-seeder';
import { seedCommunity } from './seed-data/community-seeder';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt();
  return bcrypt.hash(plain, salt);
}

async function main() {
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

  const admin = await prisma.user.upsert({
    where: { email: 'admin@elevatesde.dev' },
    update: { passwordHash: password, role: 'ADMIN' },
    create: {
      email: 'admin@elevatesde.dev',
      passwordHash: password,
      role: 'ADMIN',
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

  const flags = [
    { flagKey: 'AI_MOCK_INTERVIEW_BETA', isEnabled: true, percentageRollout: 100 },
    { flagKey: 'RESUME_ATS_SCORING', isEnabled: true, percentageRollout: 75 },
    { flagKey: 'CODE_EXECUTION_SANDBOX', isEnabled: true, percentageRollout: 100 },
    { flagKey: 'DISCUSSION_FORUMS', isEnabled: false, percentageRollout: 25 },
  ];

  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { flagKey: flag.flagKey },
      update: { isEnabled: flag.isEnabled, percentageRollout: flag.percentageRollout },
      create: flag,
    });
  }

  const auditActions = [
    { action: 'USER_REGISTERED', metadata: { email: 'candidate@elevatesde.dev', role: 'USER' } },
    { action: 'TENANT_CREATED', metadata: { name: 'Acme Corp', plan: 'TEAM' } },
    { action: 'FEATURE_FLAG_ENABLED', metadata: { flagKey: 'AI_MOCK_INTERVIEW_BETA' } },
    { action: 'ROLE_CHANGED', metadata: { from: 'USER', to: 'ADMIN', target: admin.email } },
  ];

  for (const entry of auditActions) {
    await prisma.auditLog.create({
      data: { userId: admin.id, action: entry.action, metadata: entry.metadata },
    });
  }

  const totalProblems = await seedProblems(prisma);
  console.log(`Seeded coding problems. Total problems in database: ${totalProblems}`);

  const totalMembers = await seedCommunity(prisma, password);
  console.log(`Seeded community. Total roster members: ${totalMembers}`);
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
