'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Dynamically import the content component with SSR disabled
// This prevents QueryClient and wagmi hooks from being called during SSG
const MarketDetailPageContent = dynamic(
  () => import('@/components/markets/MarketDetailPageContent'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-3 text-neutral-400">Loading market...</span>
      </div>
    ),
  }
);

export default function MarketDetailPage() {
  const params = useParams();
  const marketId = params.id as string;

  return <MarketDetailPageContent marketId={marketId} />;
}
