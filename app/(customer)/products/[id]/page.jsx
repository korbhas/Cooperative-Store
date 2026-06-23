import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { IconChevronRight } from '@tabler/icons-react'
import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/ProductCard'
import ProductActions from './ProductActions'

const CARD_COLORS = [
  '#e6efe6', '#fef3e2', '#e8effe', '#fce7f3',
  '#f0fdf4', '#fef9c3', '#f5f3ff', '#fff0eb',
]

export async function generateMetadata({ params }) {
  const { id } = await params
  const product = await prisma.product.findUnique({
    where: { id: parseInt(id), isActive: true },
    select: { name: true, description: true },
  })
  if (!product) return {}
  return {
    title: `${product.name} — TU Cooperative Store`,
    description: product.description ?? undefined,
  }
}

export default async function ProductDetailPage({ params }) {
  const { id } = await params
  const productId = parseInt(id)
  if (isNaN(productId)) notFound()

  const raw = await prisma.product.findUnique({
    where: { id: productId, isActive: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      variants: { orderBy: { sortOrder: 'asc' } },
    },
  })
  if (!raw) notFound()

  const product = {
    ...raw,
    price: raw.price.toNumber(),
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
  }

  const variants = raw.variants.map((v) => ({
    ...v,
    price: v.price.toNumber(),
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  }))

  const relatedRaw = product.category
    ? await prisma.product.findMany({
        where: { categoryId: product.category.id, isActive: true, id: { not: productId } },
        include: { category: { select: { name: true, slug: true } } },
        take: 6,
      })
    : []

  const related = relatedRaw.map((p) => ({
    ...p,
    price: p.price.toNumber(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))

  const bgColor = CARD_COLORS[product.id % CARD_COLORS.length]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-fm-paper)' }}>
      <main className="pb-20 md:pb-8" style={{ flex: 1, maxWidth: 1000, width: '100%', margin: '0 auto', padding: '20px 16px' }}>

        {/* Breadcrumb */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
          <Link href="/products" style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)', textDecoration: 'none' }}>
            All Products
          </Link>
          {product.category && (
            <>
              <IconChevronRight size={12} color="var(--color-fm-ink3)" />
              <Link
                href={`/products?category=${product.category.slug}`}
                style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)', textDecoration: 'none' }}
              >
                {product.category.name}
              </Link>
            </>
          )}
          <IconChevronRight size={12} color="var(--color-fm-ink3)" />
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink)', fontWeight: 500 }}>
            {product.name}
          </span>
        </nav>

        {/* Detail */}
        <div className="flex flex-col md:flex-row gap-8">

          {/* Image */}
          <div style={{ width: '100%', flexShrink: 0 }} className="md:w-80 lg:w-96">
            <div style={{
              position: 'relative',
              aspectRatio: '1 / 1',
              borderRadius: 14,
              overflow: 'hidden',
              background: product.imageUrl ? 'var(--color-fm-paper)' : bgColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1.5px solid var(--color-fm-line-soft)',
            }}>
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 384px"
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: 72 }}>🛒</span>
              )}
            </div>
          </div>

          {/* Info */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Category */}
            {product.category && (
              <Link
                href={`/products?category=${product.category.slug}`}
                style={{
                  display: 'inline-block',
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  color: 'var(--color-fm-green-ink)', letterSpacing: 1,
                  textTransform: 'uppercase', textDecoration: 'none',
                  background: 'var(--color-fm-green-soft)',
                  padding: '3px 8px', borderRadius: 4,
                  alignSelf: 'flex-start',
                }}
              >
                {product.category.name}
              </Link>
            )}

            {/* Name */}
            <h1 style={{
              fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 700,
              color: 'var(--color-fm-ink)', margin: 0, lineHeight: 1.25,
            }}>
              {product.name}
            </h1>

            {/* Description */}
            {product.description && (
              <p style={{
                fontFamily: 'var(--font-sans)', fontSize: 14,
                color: 'var(--color-fm-ink2)', lineHeight: 1.6, margin: 0,
              }}>
                {product.description}
              </p>
            )}

            <div style={{ height: 1, background: 'var(--color-fm-line-soft)' }} />

            {/* Actions — variant selector, price, stock, cart, wishlist */}
            <ProductActions product={product} variants={variants} />
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: 'var(--color-fm-ink)' }}>
                More from {product.category?.name ?? 'this category'}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
