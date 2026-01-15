'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PriceBar } from './PriceBar';
import type { Market } from '@/types/market';

interface MarketGridProps {
  markets: Market[];
  loading?: boolean;
}

export function MarketGrid({ markets, loading = false }: MarketGridProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="p-4 bg-neutral-900/50 border-neutral-800 animate-pulse">
            <div className="space-y-3">
              <div className="h-4 w-24 bg-neutral-800 rounded" />
              <div className="h-5 w-full bg-neutral-800 rounded" />
              <div className="h-4 w-3/4 bg-neutral-800 rounded" />
              <div className="h-3 bg-neutral-800 rounded-full mt-4" />
              <div className="flex justify-between mt-2">
                <div className="h-4 w-16 bg-neutral-800 rounded" />
                <div className="h-4 w-20 bg-neutral-800 rounded" />
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {markets.map((market) => (
        <MarketGridCard key={market.id} market={market} />
      ))}
    </div>
  );
}

function MarketGridCard({ market }: { market: Market }) {
  const router = useRouter();

  const daysUntilResolution = Math.max(
    0,
    Math.ceil((market.resolutionTime - Date.now()) / (1000 * 60 * 60 * 24))
  );

  const resolutionDate = new Date(market.resolutionTime).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Link href={`/markets/${market.id}`}>
      <Card className="p-4 bg-neutral-900/50 border-neutral-800 hover:border-orange-500/50 transition-colors cursor-pointer h-full flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            className="text-xs text-orange-400 hover:text-orange-300 truncate"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push(`/projects/${market.projectId}`);
            }}
          >
            {market.projectName}
          </button>
          <Badge
            variant={market.resolved ? 'secondary' : 'default'}
            className={
              market.resolved
                ? 'bg-neutral-700 text-neutral-300 text-xs'
                : 'bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs'
            }
          >
            {market.resolved ? 'Resolved' : 'Active'}
          </Badge>
        </div>

        <p className="text-white text-sm font-medium mb-3 line-clamp-2 flex-1">
          {market.question}
        </p>

        <div className="space-y-3 mt-auto">
          <PriceBar yesPrice={market.yesPrice} noPrice={market.noPrice} />

          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">
              {market.resolved
                ? `Outcome: ${market.outcome ? 'YES' : 'NO'}`
                : `${resolutionDate} (${daysUntilResolution}d)`}
            </span>
            <span className="text-white font-medium">
              ${market.totalVolume >= 1000
                ? `${(market.totalVolume / 1000).toFixed(1)}K`
                : market.totalVolume.toLocaleString()}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
