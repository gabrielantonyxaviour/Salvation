'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PositionDisplayProps {
  yesBalance: number;
  noBalance: number;
  yesPrice: number;
  noPrice: number;
  resolved: boolean;
  outcome?: boolean;
  claimable: number;
  onClaim?: () => void;
  isClaiming?: boolean;
}

export function PositionDisplay({
  yesBalance,
  noBalance,
  yesPrice,
  noPrice,
  resolved,
  outcome,
  claimable,
  onClaim,
  isClaiming = false,
}: PositionDisplayProps) {
  const yesValue = yesBalance * yesPrice;
  const noValue = noBalance * noPrice;

  const hasYesPosition = yesBalance > 0;
  const hasNoPosition = noBalance > 0;
  const hasPosition = hasYesPosition || hasNoPosition;

  // Determine if user won
  const wonYes = resolved && outcome === true && hasYesPosition;
  const wonNo = resolved && outcome === false && hasNoPosition;
  const won = wonYes || wonNo;

  if (!hasPosition && !resolved) {
    return (
      <div className="text-center py-4 text-neutral-400">
        <p>No positions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* YES Position */}
      <div className="p-4 bg-neutral-800/50 rounded-lg">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-neutral-400">YES Shares</span>
          {resolved && hasYesPosition && (
            <Badge
              className={
                wonYes
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border-red-500/30'
              }
            >
              {wonYes ? 'Won' : 'Lost'}
            </Badge>
          )}
        </div>
        <p className="text-xl font-bold text-green-400">
          {yesBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </p>
        <p className="text-sm text-neutral-400">
          Value: ${yesValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      {/* NO Position */}
      <div className="p-4 bg-neutral-800/50 rounded-lg">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-neutral-400">NO Shares</span>
          {resolved && hasNoPosition && (
            <Badge
              className={
                wonNo
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border-red-500/30'
              }
            >
              {wonNo ? 'Won' : 'Lost'}
            </Badge>
          )}
        </div>
        <p className="text-xl font-bold text-red-400">
          {noBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </p>
        <p className="text-sm text-neutral-400">
          Value: ${noValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      {/* Claim Button */}
      {resolved && claimable > 0 && (
        <Button
          onClick={onClaim}
          disabled={isClaiming}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isClaiming ? 'Claiming...' : `Claim $${claimable.toFixed(2)}`}
        </Button>
      )}
    </div>
  );
}
