import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="border-b border-bg-border">
      <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
        <Link href="/" className="block hover:opacity-80 transition">
          <h1 className="text-2xl font-light tracking-tight">
            <span className="text-accent">LeadGen</span> · AI Lead Qualification
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Analiza polskich firm pod kątem potencjału giftingowego B2B
          </p>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/odkrycia"
            className="text-text-muted hover:text-text-main text-sm transition"
          >
            Odkrycia →
          </Link>
          <Link
            href="/historia"
            className="text-text-muted hover:text-text-main text-sm transition"
          >
            Historia →
          </Link>
        </nav>
      </div>
    </header>
  );
}