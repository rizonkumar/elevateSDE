import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { lockRefreshFamily, RefreshTokenRepository } from './refresh-token.repository';
import { NewRefreshToken } from '../../domain/interfaces/refresh-token-repository.interface';

const gatedDescribe = process.env.RUN_DATABASE_INTEGRATION ? describe : describe.skip;

const DAY_MS = 86_400_000;

gatedDescribe('RefreshTokenRepository (database)', () => {
  let prisma: PrismaService;
  let repository: RefreshTokenRepository;
  let userId: string;

  const tokenFor = (familyId: string): NewRefreshToken => ({
    userId,
    familyId,
    token: `it-${randomUUID()}`,
    expiresAt: new Date(Date.now() + DAY_MS),
  });

  const storedId = async (token: string): Promise<string> =>
    (await prisma.refreshToken.findUniqueOrThrow({ where: { token }, select: { id: true } })).id;

  const familySize = (familyId: string): Promise<number> =>
    prisma.refreshToken.count({ where: { familyId } });

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    repository = new RefreshTokenRepository(prisma);
  });

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: { email: `refresh-it-${randomUUID()}@elevatesde.dev` },
      select: { id: true },
    });
    userId = user.id;
  });

  afterEach(async () => {
    await prisma.user.delete({ where: { id: userId } });
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
  });

  it('lets exactly one of many concurrent rotations of the same token win', async () => {
    const familyId = randomUUID();
    const original = tokenFor(familyId);
    await repository.create(original);
    const id = await storedId(original.token);

    const outcomes = await Promise.all(
      Array.from({ length: 6 }, () => repository.rotate(id, tokenFor(familyId), new Date())),
    );

    expect(outcomes.filter(Boolean)).toHaveLength(1);
    await expect(familySize(familyId)).resolves.toBe(2);
  });

  it('resolves the live successor through a chain of rotations', async () => {
    const familyId = randomUUID();
    const original = tokenFor(familyId);
    const first = tokenFor(familyId);
    const second = tokenFor(familyId);
    await repository.create(original);
    await repository.rotate(await storedId(original.token), first, new Date());
    await repository.rotate(await storedId(first.token), second, new Date());

    const rotation = await repository.findRotation(await storedId(original.token));

    expect(rotation?.liveSuccessor?.token).toBe(second.token);
  });

  it('waits for an in-flight rotation before revoking so no successor survives', async () => {
    const familyId = randomUUID();
    await repository.create(tokenFor(familyId));
    const rotationInFlight = prisma.$transaction(
      async (transaction) => {
        await lockRefreshFamily(transaction, familyId);
        await transaction.refreshToken.create({ data: tokenFor(familyId) });
        await transaction.$executeRaw`SELECT pg_sleep(0.5)`;
      },
      { timeout: 10_000 },
    );
    await new Promise((resolve) => setTimeout(resolve, 100));

    await repository.revokeFamily(familyId);
    await rotationInFlight;

    await expect(familySize(familyId)).resolves.toBe(0);
  });

  it('refuses to rotate a token from a revoked family', async () => {
    const familyId = randomUUID();
    const original = tokenFor(familyId);
    await repository.create(original);
    const id = await storedId(original.token);
    await repository.revokeFamily(familyId);

    await expect(repository.rotate(id, tokenFor(familyId), new Date())).resolves.toBe(false);
    await expect(familySize(familyId)).resolves.toBe(0);
  });
});
