import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo users
  const hashedPassword = await bcrypt.hash('password123', 12);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'alice@example.com' },
      update: {},
      create: { email: 'alice@example.com', password: hashedPassword, name: 'Alice Johnson' },
    }),
    prisma.user.upsert({
      where: { email: 'bob@example.com' },
      update: {},
      create: { email: 'bob@example.com', password: hashedPassword, name: 'Bob Smith' },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create demo products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 'product-001' },
      update: {},
      create: {
        id: 'product-001',
        name: 'Air Jordan 1 Retro High OG "Chicago"',
        description:
          'The iconic sneaker that started it all. Limited to 100 pairs worldwide. ' +
          'Hand-crafted premium leather upper, original colorway, exclusive box.',
        price: 180.0,
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
        totalStock: 100,
        currentStock: 100,
        reservedStock: 0,
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { id: 'product-002' },
      update: {},
      create: {
        id: 'product-002',
        name: 'Supreme x Louis Vuitton Box Logo Hoodie',
        description:
          'Extremely limited collaboration piece. Only 50 units. ' +
          'Premium heavyweight fleece, embroidered logos, never-before-seen colorway.',
        price: 950.0,
        imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800',
        totalStock: 50,
        currentStock: 50,
        reservedStock: 0,
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { id: 'product-003' },
      update: {},
      create: {
        id: 'product-003',
        name: 'PlayStation 5 Limited Edition',
        description:
          'Special edition PS5 with exclusive controller and 3-month Game Pass. ' +
          'Only 25 units available globally.',
        price: 599.99,
        imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800',
        totalStock: 25,
        currentStock: 25,
        reservedStock: 0,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${products.length} products`);
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
