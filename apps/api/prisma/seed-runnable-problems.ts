import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { seedRunnableProblems } from './seed-data/runnable-problems-seeder';
import { seedTopicsFromTags } from './seed-data/topics-seeder';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const total = await seedRunnableProblems(prisma);
  console.log(`Seeded ${total} runnable coding problems (slug prefix "rp-").`);
  const linkedTopics = await seedTopicsFromTags(prisma);
  console.log(`Linked ${linkedTopics} problem topics from tags.`);
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
