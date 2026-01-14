'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePrivy } from '@privy-io/react-auth';
import { useBondPurchase, useUSDCBalance } from '@/lib/contracts/hooks';
import { parseUnits, formatUnits } from 'viem';
import { Loader2 } from 'lucide-react';
import type { Project } from '@/types';

interface BondPurchaseProps {
  project: Project;
}

export function BondPurchase({ project }: BondPurchaseProps) {
  const { login, authenticated } = usePrivy();
  const [amount, setAmount] = useState('');

  const { data: usdcBalance } = useUSDCBalance();
  const {
    allowance,
    bondBalance,
    isApproving,
    isPurchasing,
    approve,
    purchase,
  } = useBondPurchase(project.id);

  const usdcAmount = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    return parseUnits(numAmount.toString(), 6); // USDC has 6 decimals
  }, [amount]);

  const bondsToReceive = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    return project.bondPrice > 0 ? numAmount / project.bondPrice : 0;
  }, [amount, project.bondPrice]);

  const availableBonds = useMemo(() => {
    const remaining = project.fundingGoal - project.fundingRaised;
    return remaining / project.bondPrice;
  }, [project]);

  const needsApproval = allowance < usdcAmount;
  const hasInsufficientBalance = usdcBalance ? usdcBalance < usdcAmount : true;
  const isValidAmount = parseFloat(amount) > 0 && bondsToReceive <= availableBonds;
  const cannotPurchase = project.status !== 'funding';

  const handleApprove = async () => {
    // Approve a bit more than needed for future purchases
    await approve(usdcAmount * BigInt(2));
  };

  const handlePurchase = async () => {
    await purchase(project.id, usdcAmount);
    setAmount('');
  };

  return (
    <Card className="p-6 bg-neutral-900/50 border-neutral-800">
      <h2 className="text-xl font-semibold text-white mb-4">Buy Bonds</h2>

      {cannotPurchase ? (
        <div className="text-center py-4">
          <p className="text-neutral-400">
            Bond purchases are only available during the funding phase.
          </p>
          <p className="text-sm text-neutral-600 mt-2">
            Current status: <span className="capitalize">{project.status}</span>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Bond Info */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Bond Price</span>
              <span className="text-white">${project.bondPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Available</span>
              <span className="text-white">{availableBonds.toLocaleString()} bonds</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Projected APY</span>
              <span className="text-green-400">{project.projectedAPY}%</span>
            </div>
          </div>

          {/* Your Holdings */}
          {authenticated && (
            <div className="pt-2 border-t border-neutral-800">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Your Bonds</span>
                <span className="text-white">
                  {formatUnits(bondBalance, 18)} bonds
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">USDC Balance</span>
                <span className="text-white">
                  ${usdcBalance ? formatUnits(usdcBalance, 6) : '0'}
                </span>
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="text-sm text-neutral-400 mb-1 block">
              Amount (USDC)
            </label>
            <Input
              type="number"
              placeholder="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-neutral-800 border-neutral-700 text-white"
              min="0"
              step="1"
            />
          </div>

          {/* Summary */}
          {isValidAmount && (
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Bonds to Receive</span>
                <span className="text-white font-semibold">
                  {bondsToReceive.toLocaleString()} bonds
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Total Cost</span>
                <span className="text-white font-semibold">${amount}</span>
              </div>
            </div>
          )}

          {/* Action Button */}
          {!authenticated ? (
            <Button
              onClick={login}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              Login to Purchase
            </Button>
          ) : needsApproval ? (
            <Button
              onClick={handleApprove}
              disabled={isApproving || !isValidAmount}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isApproving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                'Approve USDC'
              )}
            </Button>
          ) : (
            <Button
              onClick={handlePurchase}
              disabled={isPurchasing || !isValidAmount || hasInsufficientBalance}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isPurchasing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Purchasing...
                </>
              ) : hasInsufficientBalance ? (
                'Insufficient USDC'
              ) : (
                'Purchase Bonds'
              )}
            </Button>
          )}

          {/* Demo Notice */}
          <p className="text-xs text-neutral-600 text-center">
            Contracts deploy to Mantle Sepolia testnet
          </p>
        </div>
      )}
    </Card>
  );
}
