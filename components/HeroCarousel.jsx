import Link from 'next/link'
import { IconArrowRight, IconBolt, IconTag, IconSparkles } from '@tabler/icons-react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

const slides = [
  {
    id: 1,
    label: 'Flash Sale',
    Icon: IconBolt,
    title: 'Fresh Fruits & Veggies',
    description: 'Up to 30% off today',
    cta: 'Shop Now',
    href: '/products?category=fruits-vegetables',
    bg: 'from-[#0c4a6e] to-[#0e7490]',
    accent: 'bg-yellow-400 text-yellow-900',
  },
  {
    id: 2,
    label: 'Free Delivery',
    Icon: IconTag,
    title: 'Orders above ₹299',
    description: 'No delivery charges, ever',
    cta: 'Order Now',
    href: '/products',
    bg: 'from-[#be123c] to-[#e23744]',
    accent: 'bg-white/20 text-white',
  },
  {
    id: 3,
    label: 'New In',
    Icon: IconSparkles,
    title: 'Snacks & Beverages',
    description: 'New arrivals every week',
    cta: 'Explore',
    href: '/products?category=snacks-beverages',
    bg: 'from-[#065f46] to-[#059669]',
    accent: 'bg-white/20 text-white',
  },
]

export default function HeroCarousel() {
  return (
    <div className="mb-6 w-full">
      <Carousel opts={{ loop: true }}>
        <CarouselContent>
          {slides.map(({ id, label, Icon, title, description, cta, href, bg, accent }) => (
            <CarouselItem key={id}>
              <div className={`relative h-56 overflow-hidden rounded-2xl bg-gradient-to-br ${bg} sm:h-72`}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-white">
                  <span className={`mb-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${accent}`}>
                    <Icon size={11} />
                    {label}
                  </span>
                  <h2 className="mb-2 text-2xl font-bold sm:text-3xl" style={{ fontFamily: 'var(--font-heading)' }}>
                    {title}
                  </h2>
                  <p className="mb-6 max-w-md text-sm opacity-90">{description}</p>
                  <Link
                    href={href}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-5 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-white"
                  >
                    {cta} <IconArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4" />
        <CarouselNext className="right-4" />
      </Carousel>
    </div>
  )
}
