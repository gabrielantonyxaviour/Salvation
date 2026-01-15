'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PriceBar } from './PriceBar';
import type { Market } from '@/types/market';

interface MarketCardProps {
  market: Market;
}

export function MarketCard({ market }: MarketCardProps) {
  const router = useRouter();

  const daysUntilResolution = Math.max(
    0,
    Math.ceil((market.resolutionTime - Date.now()) / (1000 * 60 * 60 * 24))
  );

  const resolutionDate = new Date(market.resolutionTime).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link href={`/markets/${market.id}`}>
      <Card className="p-6 bg-neutral-900/50 border-neutral-800 hover:border-orange-500/50 transition-colors cursor-pointer">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                className="text-sm text-orange-400 hover:text-orange-300"
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
                    ? 'bg-neutral-700 text-neutral-300'
                    : 'bg-green-500/20 text-green-400 border-green-500/30'
                }
              >
                {market.resolved ? 'Resolved' : 'Active'}
              </Badge>
            </div>
            <p className="text-white font-medium mb-2">{market.question}</p>
            <p className="text-sm text-neutral-400">
              {market.resolved
                ? `Resolved: ${market.outcome ? 'YES' : 'NO'}`
                : `Resolution: ${resolutionDate} (${daysUntilResolution} days)`}
            </p>
          </div>

          <div className="flex items-center gap-6">
            {/* Price Bar */}
            <div className="w-48">
              <PriceBar yesPrice={market.yesPrice} noPrice={market.noPrice} />
            </div>

            {/* Volume */}
            <div className="text-right min-w-[80px]">
              <p className="text-sm text-neutral-400">Volume</p>
              <p className="text-white font-medium">
                ${market.totalVolume.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
