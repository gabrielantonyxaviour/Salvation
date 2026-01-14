'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import the content component with SSR disabled
// This prevents wagmi hooks from being called during SSG
const MapPageContent = dynamic(
  () => import('@/components/map/MapPageContent'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-3 text-neutral-400">Loading map...</span>
      </div>
    ),
  }
);

export default function MapPage() {
  return <MapPageContent />;
}
