import { prisma } from '@/lib/prisma'
import { Suspense } from 'react'
import BottomNav from '@/components/BottomNav'
import CategoryFilter from '@/components/CategoryFilter'
import ProductCard from '@/components/ProductCard'
import SortSelect from '@/components/SortSelect'

async function getProducts({ q, category, sort }) {
  const where = { isActive: true }
  if (q) where.name = { contains: q, mode: 'insensitive' }
  if (category) where.category = { slug: category }

  let orderBy = { name: 'asc' }
  if (sort === 'price_asc') orderBy = { price: 'asc' }
  else if (sort === 'price_desc') orderBy = { price: 'desc' }
  else if (sort === 'newest') orderBy = { createdAt: 'desc' }

  try {
    return await prisma.product.findMany({
      where,
      orderBy,
      include: { category: { select: { name: true, slug: true } } },
    })
  } catch {
    return []
  }
}

async function getCategories() {
  try {
    return await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } })
  } catch {
    return []
  }
}

export default async function ProductsPage({ searchParams }) {
  const { q, category, sort } = await searchParams
  const [products, categories] = await Promise.all([
    getProducts({ q, category, sort }),
    getCategories(),
  ])

  const activeCategory = categories.find((c) => c.slug === category)
  const title = q ? `"${q}"` : activeCategory?.name ?? 'All Products'

  const serialized = products.map((p) => ({
    ...p,
    price: p.price.toNumber(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-fm-paper)' }}>
      <main className="pb-20 md:pb-8" style={{ flex: 1, maxWidth: 1100, width: '100%', margin: '0 auto', padding: '20px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14, gap: 8 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: 'var(--color-fm-ink)' }}>
              {title}
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)', marginTop: 2 }}>
              {serialized.length} item{serialized.length !== 1 ? 's' : ''}
            </div>
          </div>
          <Suspense fallback={<div style={{ width: 140, height: 32, borderRadius: 7, background: 'var(--color-fm-paper2)' }} />}>
            <SortSelect currentSort={sort ?? ''} />
          </Suspense>
        </div>

        {/* Category pills */}
        <CategoryFilter
          categories={categories}
          activeCategory={category ?? null}
          currentQ={q ?? ''}
          currentSort={sort ?? ''}
        />

        {/* Grid */}
        {serialized.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🔍</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 600, color: 'var(--color-fm-ink)' }}>
              No products found
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)', marginTop: 4 }}>
              Try a different search or browse another category
            </div>
          </div>
        ) : (
          <div
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            style={{ marginTop: 16 }}
          >
            {serialized.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
