import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import PromoBanners from '@/components/PromoBanners'
import BottomNav from '@/components/BottomNav'
import { CATEGORY_EMOJIS } from '@/lib/config'

async function getCategories() {
  try {
    return await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } })
  } catch {
    return []
  }
}

export default async function HomePage() {
  const categories = await getCategories()

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-fm-paper)' }}>
      <main className="pb-20 md:pb-8" style={{ padding: '24px 16px', maxWidth: 960, width: '100%', margin: '0 auto' }}>

        <PromoBanners />

        {/* Heading */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--color-fm-ink3)', letterSpacing: 1.5,
            textTransform: 'uppercase', marginBottom: 6,
          }}>
            What are you looking for?
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: 'var(--color-fm-ink)' }}>
            Shop by Category
          </div>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {/* All Products tile */}
          <Link href="/products" style={{
            aspectRatio: '128 / 188', borderRadius: 8,
            border: '1.5px solid var(--color-fm-line-soft)',
            background: 'transparent', display: 'flex',
            flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', textDecoration: 'none', gap: 10,
          }}>
            <span style={{ fontSize: 32, lineHeight: 1 }}>🛒</span>
            <span style={{
              color: 'var(--color-fm-ink)', fontWeight: 700, fontSize: 12,
              textAlign: 'center', padding: '0 8px', lineHeight: 1.3,
            }}>
              All Products
            </span>
          </Link>

          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              style={{
                aspectRatio: '128 / 188', borderRadius: 8,
                border: '1.5px solid var(--color-fm-line-soft)',
                background: 'transparent', display: 'flex',
                flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', textDecoration: 'none', gap: 10,
              }}
            >
              <span style={{ fontSize: 32, lineHeight: 1 }}>
                {CATEGORY_EMOJIS[i % CATEGORY_EMOJIS.length]}
              </span>
              <span style={{
                color: 'var(--color-fm-ink)', fontWeight: 700, fontSize: 12,
                textAlign: 'center', padding: '0 8px', lineHeight: 1.3,
              }}>
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
