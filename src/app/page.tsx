import Link from 'next/link';
import { NipAnalyzer } from '@/components/NipAnalyzer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-bg-border">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light tracking-tight">
              <span className="text-accent">LeadGen</span> · AI Lead Qualification
            </h1>
            <p className="text-text-muted text-sm mt-1">
              Analiza polskich firm pod kątem potencjału giftingowego B2B
            </p>
          </div>
          <Link
            href="/historia"
            className="text-text-muted hover:text-text-main text-sm transition"
          >
            Historia →
          </Link>
        </div>
      </header>
      <NipAnalyzer />
    </main>
  );
}