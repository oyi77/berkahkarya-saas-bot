import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test user if none exists
  const testUser = await prisma.user.upsert({
    where: { telegramId: BigInt(228956686) },
    update: {},
    create: {
      telegramId: BigInt(228956686),
      username: 'Oyi77',
      firstName: 'WhoMe',
      creditBalance: 100.0,
      tier: 'premium',
    },
  });

  console.log(`✅ Seeded user: ${testUser.username}`);
  console.log('✨ Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
