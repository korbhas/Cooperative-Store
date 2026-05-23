import Link from 'next/link'
import { ArrowRight, Zap, Tag, Sparkles } from 'lucide-react'

const banners = [
  {
    id: 1,
    label: 'Flash Sale',
    Icon: Zap,
    title: 'Fresh Fruits & Veggies',
    subtitle: 'Up to 30% off today',
    cta: 'Shop Now',
    href: '/products?category=fruits-vegetables',
    bg: 'from-[#0c4a6e] to-[#0e7490]',
    accent: 'bg-yellow-400 text-yellow-900',
  },
  {
    id: 2,
    label: 'Free Delivery',
    Icon: Tag,
    title: 'Orders above ₹299',
    subtitle: 'No delivery charges, ever',
    cta: 'Order Now',
    href: '/products',
    bg: 'from-[#be123c] to-[#e23744]',
    accent: 'bg-white/20 text-white',
  },
  {
    id: 3,
    label: 'New In',
    Icon: Sparkles,
    title: 'Snacks & Beverages',
    subtitle: 'New arrivals every week',
    cta: 'Explore',
    href: '/products?category=snacks-beverages',
    bg: 'from-[#065f46] to-[#059669]',
    accent: 'bg-white/20 text-white',
  },
]

export default function PromoBanners() {
  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {banners.map(({ id, label, Icon, title, subtitle, cta, href, bg, accent }) => (
        <Link
          key={id}
          href={href}
          className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br ${bg} p-5 text-white transition-transform hover:-translate-y-0.5 hover:shadow-xl`}
        >
          <div className="flex items-start justify-between">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${accent}`}>
              <Icon size={11} />
              {label}
            </span>
          </div>
          <div className="mt-8">
            <h3 className="text-lg font-extrabold leading-tight">{title}</h3>
            <p className="mt-0.5 text-sm text-white/70">{subtitle}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-white/90">
              {cta} <ArrowRight size={14} />
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
