import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding OPENRON database...');

  const store = await prisma.store.upsert({
    where: { id: 'store-1' },
    update: {},
    create: {
      id: 'store-1',
      name: 'Sharma General Store',
      ownerName: 'Radhe Shyam Sharma',
      phone: '9876543210',
      currency: 'INR',
    },
  });

  // Seed sample customers
  const ramesh = await prisma.customer.upsert({
    where: { id: 'cust-1' },
    update: {},
    create: {
      id: 'cust-1',
      storeId: store.id,
      name: 'Ramesh',
      phone: '9812345678',
      currentBalance: 500,
    },
  });

  const suresh = await prisma.customer.upsert({
    where: { id: 'cust-2' },
    update: {},
    create: {
      id: 'cust-2',
      storeId: store.id,
      name: 'Suresh',
      phone: '9823456789',
      currentBalance: 0,
    },
  });

  // Seed sample products
  await prisma.product.upsert({
    where: { id: 'prod-1' },
    update: {},
    create: {
      id: 'prod-1',
      storeId: store.id,
      name: 'Aata',
      unit: 'kg',
      currentStock: 50,
      salePrice: 40,
      costPrice: 32,
    },
  });

  await prisma.product.upsert({
    where: { id: 'prod-2' },
    update: {},
    create: {
      id: 'prod-2',
      storeId: store.id,
      name: 'Chawal',
      unit: 'kg',
      currentStock: 30,
      salePrice: 60,
      costPrice: 50,
    },
  });

  console.log(`Database seeded successfully for store: ${store.name}`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
