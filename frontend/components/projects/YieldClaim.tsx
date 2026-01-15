'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePrivy } from '@privy-io/react-auth';
import { useYield } from '@/lib/contracts/hooks';
import { formatUnits } from 'viem';
import { Loader2, TrendingUp, DollarSign } from 'lucide-react';
import type { Project } from '@/types';

interface YieldClaimProps {
  project: Project;
}

export function YieldClaim({ project }: YieldClaimProps) {
  const { login, authenticated } = usePrivy();
  const { claimable, yieldInfo, isClaiming, claim } = useYield(project.id);

  const handleClaim = async () => {
    await claim(project.id);
  };

  const claimableAmount = Number(formatUnits(claimable, 6));
  const hasClaimable = claimableAmount > 0;

  // Only show for active projects
  if (project.status !== 'active' && project.status !== 'completed') {
    return null;
  }

  return (
    <Card className="p-6 bg-neutral-900/50 border-neutral-800">
      <h2 className="text-xl font-semibold text-white mb-4">Yield Earnings</h2>

      <div className="space-y-4">
        {/* Yield Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-neutral-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              Current APY
            </div>
            <p className="text-xl font-bold text-green-400">
              {yieldInfo?.apy?.toFixed(1) || project.projectedAPY}%
            </p>
          </div>
          <div className="p-3 bg-neutral-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
              <DollarSign className="w-4 h-4" />
              Total Revenue
            </div>
            <p className="text-xl font-bold text-white">
              ${yieldInfo?.totalRevenue?.toLocaleString() || '0'}
            </p>
          </div>
        </div>

        {/* Claimable Amount */}
        {authenticated && (
          <div className="p-4 bg-gradient-to-r from-orange-500/10 to-green-500/10 rounded-lg border border-orange-500/20">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-neutral-400">Your Claimable Yield</p>
                <p className="text-2xl font-bold text-white">
                  ${claimableAmount.toFixed(2)}
                </p>
              </div>
              <Button
                onClick={handleClaim}
                disabled={isClaiming || !hasClaimable}
                className="bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25"
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Claiming...
                  </>
                ) : hasClaimable ? (
                  'Claim Yield'
                ) : (
                  'No Yield Available'
                )}
              </Button>
            </div>
          </div>
        )}

        {!authenticated && (
          <Button
            onClick={login}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25"
          >
            Login to View Your Yield
          </Button>
        )}

        {/* Revenue Distribution Info */}
        {yieldInfo && (
          <div className="text-xs text-neutral-600 text-center">
            Total distributed: ${yieldInfo.distributed.toLocaleString()}
          </div>
        )}
      </div>
    </Card>
  );
}
