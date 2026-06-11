import { unstable_cache } from 'next/cache'
import { cookies } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import PromoBanners from '@/components/PromoBanners'
import CategoryCards from '@/components/CategoryCards'
import WelcomeOverlay, { WELCOME_SEEN_COOKIE } from '@/components/welcome/WelcomeOverlay'
import { welcomeIllustrations } from '@/components/welcome/illustrations'
import { CATEGORY_EMOJIS } from '@/lib/config'

const getCategories = unstable_cache(
  async () => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: { select: { products: { where: { isActive: true } } } },
          products: {
            where: { isActive: true, imageUrl: { not: null } },
            select: { imageUrl: true },
            take: 1,
          },
        },
      })
      return categories.map((cat, i) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        count: cat._count.products,
        imageUrl: cat.products[0]?.imageUrl ?? null,
        emoji: CATEGORY_EMOJIS[i % CATEGORY_EMOJIS.length],
      }))
    } catch {
      return []
    }
  },
  ['categories-cards'],
  { revalidate: 3600, tags: ['categories'] }
)

export default async function HomePage() {
  const [categories, { userId }, cookieStore] = await Promise.all([
    getCategories(),
    auth(),
    cookies(),
  ])
  const showWelcome = !userId && !cookieStore.has(WELCOME_SEEN_COOKIE)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-fm-paper)' }}>
      {showWelcome && <WelcomeOverlay illustrations={welcomeIllustrations()} />}
      <main className="pb-20 md:pb-8" style={{ padding: '24px 16px', maxWidth: 960, width: '100%', margin: '0 auto' }}>

        <PromoBanners />

        <CategoryCards categories={categories} />
      </main>

    </div>
  )
}
