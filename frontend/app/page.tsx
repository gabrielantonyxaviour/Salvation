'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import the content component with SSR disabled
// This prevents wagmi hooks from being called during SSG
const HomePageContent = dynamic(
  () => import('@/components/home/HomePageContent'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    ),
  }
);

export default function Home() {
  return <HomePageContent />;
}
