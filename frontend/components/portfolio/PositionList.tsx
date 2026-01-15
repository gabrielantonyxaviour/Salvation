'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMarketPositions } from '@/lib/contracts/hooks';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { MarketPosition } from '@/types';

interface PositionListProps {
  positions: MarketPosition[];
  onClaimSuccess?: () => void;
}

function PositionRow({ position, onClaimSuccess }: { position: MarketPosition; onClaimSuccess?: () => void }) {
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      // The claim will be handled by the useMarketPositions hook when connected
      // For now, we simulate it
      await new Promise(resolve => setTimeout(resolve, 1500));
      onClaimSuccess?.();
    } finally {
      setIsClaiming(false);
    }
  };

  const getStatusBadge = () => {
    if (!position.resolved) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">
          <Clock className="w-3 h-3" />
          Active
        </span>
      );
    }

    if (position.won) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">
          <CheckCircle className="w-3 h-3" />
          Won
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-500/20 text-red-400">
        <XCircle className="w-3 h-3" />
        Lost
      </span>
    );
  };

  const totalShares = position.yesBalance + position.noBalance;
  const totalValue = position.yesValue + position.noValue;
  const side = position.yesBalance > position.noBalance ? 'YES' : 'NO';

  return (
    <tr className="hover:bg-neutral-800/30 transition-colors">
      <td className="px-6 py-4">
        <div>
          <Link
            href={`/markets/${position.marketId}`}
            className="text-white hover:text-orange-400 font-medium"
          >
            {position.projectName}
          </Link>
          <p className="text-xs text-neutral-400 line-clamp-1">{position.question}</p>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={side === 'YES' ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
          {side}
        </span>
      </td>
      <td className="px-6 py-4 text-white">
        {totalShares.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </td>
      <td className="px-6 py-4 text-white">
        ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td className="px-6 py-4">
        {getStatusBadge()}
      </td>
      <td className="px-6 py-4">
        {position.resolved && position.won && position.claimable > 0 ? (
          <Button
            size="sm"
            onClick={handleClaim}
            disabled={isClaiming}
            className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/25"
          >
            {isClaiming ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Claiming...
              </>
            ) : (
              `Claim $${position.claimable.toFixed(2)}`
            )}
          </Button>
        ) : position.resolved ? (
          <span className="text-neutral-600 text-sm">-</span>
        ) : (
          <Link href={`/markets/${position.marketId}`}>
            <Button size="sm" variant="outline" className="border-neutral-700 text-white hover:bg-neutral-800">
              Trade
            </Button>
          </Link>
        )}
      </td>
    </tr>
  );
}

export function PositionList({ positions, onClaimSuccess }: PositionListProps) {
  if (positions.length === 0) {
    return (
      <Card className="p-8 bg-neutral-900/50 border-neutral-800 text-center">
        <p className="text-neutral-400 mb-4">You don't have any prediction positions yet.</p>
        <Link href="/markets">
          <Button className="bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25">
            Browse Markets
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="bg-neutral-900/50 border-neutral-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Market
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Side
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Shares
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {positions.map((position) => (
              <PositionRow
                key={position.marketId}
                position={position}
                onClaimSuccess={onClaimSuccess}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
