'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import the content component with SSR disabled
// This prevents wagmi hooks from being called during SSG
const FaucetPageContent = dynamic(
  () => import('@/components/faucet/FaucetPageContent'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-3 text-neutral-400">Loading faucet...</span>
      </div>
    ),
  }
);

export default function FaucetPage() {
  return <FaucetPageContent />;
}
