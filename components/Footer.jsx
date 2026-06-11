import Link from 'next/link'

const YEAR = new Date().getFullYear()

const LINKS = [
  { title: 'Home', href: '/' },
  { title: 'Products', href: '/products' },
]

export default function Footer() {
  return (
    <footer className="w-full" style={{ background: 'var(--color-fm-paper2)' }}>
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="flex w-full flex-row flex-wrap items-center justify-center gap-x-12 gap-y-3 text-center md:justify-between">
          <Link
            href="/"
            className="shrink-0 text-[15px] font-bold"
            style={{ color: 'var(--color-fm-green)', fontFamily: 'var(--font-heading)' }}
          >
            FreshMart
          </Link>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {LINKS.map(({ title, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <hr className="border-border my-4" />
        <p className="text-center text-sm text-muted-foreground">
          &copy; {YEAR} FreshMart. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
