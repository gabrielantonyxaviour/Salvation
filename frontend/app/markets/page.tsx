'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import the content component with SSR disabled
// This prevents wagmi hooks from being called during SSG
const MarketsPageContent = dynamic(
  () => import('@/components/markets/MarketsPageContent'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-3 text-neutral-400">Loading markets...</span>
      </div>
    ),
  }
);

export default function MarketsPage() {
  return <MarketsPageContent />;
}
