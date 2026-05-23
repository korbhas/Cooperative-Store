import { PrismaClient } from '../lib/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Categories
  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: 'fruits-vegetables' }, update: {}, create: { name: 'Fruits & Vegetables', slug: 'fruits-vegetables', sortOrder: 0 } }),
    prisma.category.upsert({ where: { slug: 'dairy-eggs' }, update: {}, create: { name: 'Dairy & Eggs', slug: 'dairy-eggs', sortOrder: 1 } }),
    prisma.category.upsert({ where: { slug: 'grains-staples' }, update: {}, create: { name: 'Grains & Staples', slug: 'grains-staples', sortOrder: 2 } }),
    prisma.category.upsert({ where: { slug: 'snacks-beverages' }, update: {}, create: { name: 'Snacks & Beverages', slug: 'snacks-beverages', sortOrder: 3 } }),
    prisma.category.upsert({ where: { slug: 'spices-condiments' }, update: {}, create: { name: 'Spices & Condiments', slug: 'spices-condiments', sortOrder: 4 } }),
    prisma.category.upsert({ where: { slug: 'bakery' }, update: {}, create: { name: 'Bakery', slug: 'bakery', sortOrder: 5 } }),
  ])

  const cat = Object.fromEntries(categories.map((c) => [c.slug, c.id]))

  // Products
  const products = [
    { name: 'Banana', description: 'Fresh yellow bananas', categoryId: cat['fruits-vegetables'], price: 40, unit: 'dozen', stockQty: 100 },
    { name: 'Tomato', description: 'Fresh red tomatoes', categoryId: cat['fruits-vegetables'], price: 30, unit: 'kg', stockQty: 80 },
    { name: 'Onion', description: 'Fresh onions', categoryId: cat['fruits-vegetables'], price: 35, unit: 'kg', stockQty: 120 },
    { name: 'Apple', description: 'Shimla apples', categoryId: cat['fruits-vegetables'], price: 150, unit: 'kg', stockQty: 60 },
    { name: 'Milk (500ml)', description: 'Full cream milk', categoryId: cat['dairy-eggs'], price: 30, unit: 'packet', stockQty: 200 },
    { name: 'Eggs (6 pack)', description: 'Farm fresh eggs', categoryId: cat['dairy-eggs'], price: 50, unit: 'pack', stockQty: 150 },
    { name: 'Paneer (200g)', description: 'Fresh cottage cheese', categoryId: cat['dairy-eggs'], price: 80, unit: 'pack', stockQty: 40 },
    { name: 'Rice (5kg)', description: 'Basmati rice', categoryId: cat['grains-staples'], price: 350, unit: 'bag', stockQty: 50 },
    { name: 'Wheat Flour (5kg)', description: 'Whole wheat atta', categoryId: cat['grains-staples'], price: 250, unit: 'bag', stockQty: 60 },
    { name: 'Toor Dal (1kg)', description: 'Yellow lentils', categoryId: cat['grains-staples'], price: 140, unit: 'bag', stockQty: 70 },
    { name: 'Chips (Large)', description: 'Classic salted potato chips', categoryId: cat['snacks-beverages'], price: 50, unit: 'pack', stockQty: 100 },
    { name: 'Cola (2L)', description: 'Carbonated soft drink', categoryId: cat['snacks-beverages'], price: 90, unit: 'bottle', stockQty: 80 },
    { name: 'Turmeric Powder', description: 'Pure turmeric powder', categoryId: cat['spices-condiments'], price: 60, unit: '200g', stockQty: 90 },
    { name: 'Red Chili Powder', description: 'Spicy red chili powder', categoryId: cat['spices-condiments'], price: 70, unit: '200g', stockQty: 85 },
    { name: 'Bread', description: 'Whole wheat bread loaf', categoryId: cat['bakery'], price: 45, unit: 'loaf', stockQty: 60 },
  ]

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: (await prisma.product.findFirst({ where: { name: p.name } }))?.id ?? 0 },
      update: {},
      create: p,
    })
  }

  // Admin user
  const passwordHash = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@freshmart.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@freshmart.com',
      role: 'admin',
      passwordHash,
      emailVerified: true,
    },
  })

  // Delivery area
  await prisma.deliveryArea.upsert({
    where: { pincode: '784028' },
    update: {},
    create: { pincode: '784028', areaName: 'Tezpur', isActive: true },
  })

  // Settings
  const settings = [
    { key: 'store_name', value: 'FreshMart' },
    { key: 'delivery_fee', value: '25' },
    { key: 'min_order_amount', value: '0' },
    { key: 'delivery_eta_min', value: '30' },
    { key: 'delivery_eta_max', value: '60' },
    { key: 'store_open', value: 'true' },
  ]

  for (const s of settings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s })
  }

  console.log('Seed complete.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
