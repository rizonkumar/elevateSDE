import Link from 'next/link';

interface FooterColumn {
  heading: string;
  links: { label: string; href: string }[];
}

const COLUMNS: FooterColumn[] = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'See it in action', href: '#product' },
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Pricing', href: '#pricing' },
    ],
  },
  {
    heading: 'Solutions',
    links: [
      { label: 'For candidates', href: '#solutions' },
      { label: 'For teams', href: '#solutions' },
      { label: 'For admins', href: '#solutions' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { label: 'Create account', href: '/register' },
      { label: 'Log in', href: '/login' },
      { label: 'Admin console', href: '/admin/login' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Security', href: '#' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-(--color-border-subtle) bg-(--color-bg)">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.4fr_repeat(4,1fr)] lg:px-8">
        <div className="flex flex-col gap-4">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-(--color-text-primary) hover:opacity-85"
          >
            Elevate<span className="text-(--color-accent)">SDE</span>
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-(--color-text-muted)">
            Enterprise-grade AI interview preparation for engineers and the teams that hire them.
          </p>
          <span className="mt-2 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-(--color-text-muted)">
            <span className="h-1.5 w-1.5 rounded-full bg-(--color-success)" />
            All systems normal
          </span>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.heading} className="flex flex-col gap-4">
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-(--color-text-muted)">
              {column.heading}
            </h3>
            <ul className="flex flex-col gap-3">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-(--color-text-primary) transition-colors hover:text-(--color-accent)"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-(--color-border-subtle)">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-(--color-text-muted) sm:flex-row sm:px-6 lg:px-8">
          <span>© 2026 ElevateSDE. All rights reserved.</span>
          <span className="font-mono uppercase tracking-[0.1em]">Built for software engineers</span>
        </div>
      </div>
    </footer>
  );
}
