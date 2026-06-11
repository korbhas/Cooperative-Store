'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useInView } from 'motion/react'
import { IconArrowRight } from '@tabler/icons-react'

const EASE = [0.21, 0.47, 0.32, 0.98]

export default function CategoryCards({ categories }) {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 })

  return (
    <section ref={sectionRef} className="flex w-full flex-col gap-5">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <div className="mb-1.5 font-mono text-[10px] tracking-[1.5px] text-muted-foreground uppercase">
            What are you looking for?
          </div>
          <h2 className="font-heading text-[22px] leading-none font-bold text-foreground">
            Shop by Category
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
        >
          <Link
            href="/products"
            className="group flex items-center gap-1.5 text-sm font-medium whitespace-nowrap text-secondary-foreground transition-all hover:opacity-80"
          >
            See all
            <IconArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="w-full overflow-x-auto xl:[scrollbar-width:none] xl:[-ms-overflow-style:none] xl:[&::-webkit-scrollbar]:hidden">
        <div className="flex gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.1 + index * 0.1, ease: EASE }}
              className="w-full max-w-60 shrink-0"
            >
              <Link
                href={`/products?category=${category.slug}`}
                className="group flex items-center overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/30"
              >
                {/* Image Container */}
                <div className="relative flex h-20 w-22 shrink-0 items-center justify-center overflow-hidden border-r border-border bg-secondary">
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt=""
                      fill
                      sizes="88px"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <span className="text-3xl">{category.emoji}</span>
                  )}
                </div>

                {/* Content Container */}
                <div className="min-w-0 flex-1 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {category.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {category.count} item{category.count === 1 ? '' : 's'}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
