export const revalidate = 60;

import { NipAnalyzer } from '@/components/NipAnalyzer';
import { RadarFeed } from '@/components/RadarFeed';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className="min-h-screen">
      <NipAnalyzer />
      <RadarFeed />
    </main>
  );
}