'use client';

import { MarketCard } from './MarketCard';
import { Card } from '@/components/ui/card';
import type { Market } from '@/types/market';

interface MarketListProps {
  markets: Market[];
  loading?: boolean;
}

export function MarketList({ markets, loading = false }: MarketListProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 bg-neutral-900/50 border-neutral-800 animate-pulse">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="h-4 w-32 bg-neutral-800 rounded" />
                <div className="h-5 w-3/4 bg-neutral-800 rounded" />
                <div className="h-4 w-40 bg-neutral-800 rounded" />
              </div>
              <div className="flex items-center gap-6">
                <div className="w-48">
                  <div className="h-3 bg-neutral-800 rounded-full" />
                </div>
                <div className="text-right min-w-[80px]">
                  <div className="h-4 w-12 bg-neutral-800 rounded mb-1" />
                  <div className="h-5 w-16 bg-neutral-800 rounded" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <Card className="p-12 bg-neutral-900/50 border-neutral-800 text-center">
        <p className="text-neutral-400">No markets found</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {markets.map((market) => (
        <MarketCard key={market.id} market={market} />
      ))}
    </div>
  );
}
