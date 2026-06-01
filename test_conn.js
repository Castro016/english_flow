const { PrismaClient } = require('@prisma/client');

async function test() {
  const prisma = new PrismaClient();
  console.log('Testing connection to:', process.env.DATABASE_URL);
  try {
    const start = Date.now();
    const count = await prisma.user.count();
    console.log(`Connection successful! Total users: ${count}. Took ${Date.now() - start}ms`);
  } catch (e) {
    console.error('Connection failed:');
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
