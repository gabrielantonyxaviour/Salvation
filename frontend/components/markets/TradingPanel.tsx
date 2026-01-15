'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useBalance } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { PositionDisplay } from './PositionDisplay';
import { useMarketTrade } from '@/lib/contracts/hooks/useMarketTrade';
import { useMarketPositions } from '@/lib/contracts/hooks/useMarketPositions';
import type { Market, TradeSide, TradeAction } from '@/types/market';

interface TradingPanelProps {
  market: Market;
}

export function TradingPanel({ market }: TradingPanelProps) {
  const { login, authenticated } = usePrivy();
  const { address } = useAccount();

  const [side, setSide] = useState<TradeSide>('yes');
  const [action, setAction] = useState<TradeAction>('buy');
  const [amount, setAmount] = useState('');

  // Get USDC balance
  const { data: usdcBalance } = useBalance({
    address,
    token: market.collateralAddress,
  });

  // Market trade hook
  const {
    buy,
    sell,
    approve,
    quote,
    needsApproval,
    isApproving,
    isTrading,
    isLoading,
  } = useMarketTrade({
    marketAddress: market.address,
    collateralAddress: market.collateralAddress,
    userAddress: address,
    yesShares: market.yesShares,
    noShares: market.noShares,
    liquidity: market.liquidity,
  });

  // Market positions hook
  const {
    yesBalance,
    noBalance,
    claimable,
    claim,
    isClaiming,
    refetch: refetchPositions,
  } = useMarketPositions({
    marketAddress: market.address,
    yesTokenAddress: market.yesTokenAddress,
    noTokenAddress: market.noTokenAddress,
    userAddress: address,
    yesPrice: market.yesPrice,
    noPrice: market.noPrice,
    resolved: market.resolved,
    outcome: market.outcome,
  });

  // Calculate quote when amount changes
  const shares = parseFloat(amount) || 0;
  const { cost, priceImpact } = useMemo(() => {
    return quote(side, action, shares);
  }, [quote, side, action, shares]);

  // Check if user has enough balance
  const userBalance = usdcBalance ? Number(formatUnits(usdcBalance.value, usdcBalance.decimals)) : 0;
  const insufficientBalance = action === 'buy' && cost > userBalance;

  // Check if user has enough shares to sell
  const userShares = side === 'yes' ? yesBalance : noBalance;
  const insufficientShares = action === 'sell' && shares > userShares;

  // Handle trade
  const handleTrade = async () => {
    if (!shares || shares <= 0) return;

    try {
      if (action === 'buy') {
        // Check if approval needed
        if (needsApproval) {
          await approve(parseUnits('1000000', 6)); // Approve large amount
          return;
        }
        await buy(side, shares);
      } else {
        await sell(side, shares);
      }

      setAmount('');
      refetchPositions();
    } catch (error) {
      console.error('Trade failed:', error);
    }
  };

  // If market is resolved, show claim UI
  if (market.resolved) {
    return (
      <Card className="p-6 bg-neutral-900/50 border-neutral-800">
        <h2 className="text-xl font-semibold text-white mb-4">Market Resolved</h2>
        <div className="text-center p-4 bg-neutral-800/50 rounded-lg mb-4">
          <p className="text-neutral-400 mb-2">Outcome</p>
          <p className={`text-2xl font-bold ${market.outcome ? 'text-green-400' : 'text-red-400'}`}>
            {market.outcome ? 'YES' : 'NO'}
          </p>
        </div>

        {authenticated && address ? (
          <PositionDisplay
            yesBalance={yesBalance}
            noBalance={noBalance}
            yesPrice={market.yesPrice}
            noPrice={market.noPrice}
            resolved={market.resolved}
            outcome={market.outcome}
            claimable={claimable}
            onClaim={claim}
            isClaiming={isClaiming}
          />
        ) : (
          <Button onClick={() => login()} className="w-full bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25">
            Login to View Positions
          </Button>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-neutral-900/50 border-neutral-800">
      <h2 className="text-xl font-semibold text-white mb-4">Trade</h2>

      {/* Side Toggle */}
      <div className="flex gap-2 mb-4">
        <Button
          variant="outline"
          onClick={() => setSide('yes')}
          className={side === 'yes' ? 'bg-green-600 hover:bg-green-700 border-green-600 text-white shadow-none flex-1' : 'border-neutral-700 shadow-none flex-1'}
        >
          YES
        </Button>
        <Button
          variant="outline"
          onClick={() => setSide('no')}
          className={side === 'no' ? 'bg-red-600 hover:bg-red-700 border-red-600 text-white shadow-none flex-1' : 'border-neutral-700 shadow-none flex-1'}
        >
          NO
        </Button>
      </div>

      {/* Action Toggle */}
      <div className="flex gap-2 mb-4">
        <Button
          variant="outline"
          onClick={() => setAction('buy')}
          className={action === 'buy' ? 'bg-neutral-700 hover:bg-neutral-600 border-neutral-700 text-white shadow-none flex-1' : 'border-neutral-700 shadow-none flex-1'}
        >
          BUY
        </Button>
        <Button
          variant="outline"
          onClick={() => setAction('sell')}
          className={action === 'sell' ? 'bg-neutral-700 hover:bg-neutral-600 border-neutral-700 text-white shadow-none flex-1' : 'border-neutral-700 shadow-none flex-1'}
        >
          SELL
        </Button>
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <label className="text-sm text-neutral-400">Shares</label>
          {action === 'sell' && (
            <button
              onClick={() => setAmount(userShares.toString())}
              className="text-sm text-orange-400 hover:text-orange-300"
            >
              Max: {userShares.toFixed(2)}
            </button>
          )}
        </div>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          className="bg-neutral-800 border-neutral-700 text-white"
          min="0"
          step="0.01"
        />
      </div>

      {/* Cost/Return Display */}
      <div className="p-4 bg-neutral-800/50 rounded-lg mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-neutral-400">Price per share</span>
          <span className="text-white">
            ${(side === 'yes' ? market.yesPrice : market.noPrice).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-neutral-400">{action === 'buy' ? 'Cost' : 'Return'}</span>
          <span className="text-white font-semibold">${cost.toFixed(2)}</span>
        </div>
        {priceImpact > 1 && (
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Price Impact</span>
            <span className={priceImpact > 5 ? 'text-red-400' : 'text-yellow-400'}>
              {priceImpact.toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      {/* Price Impact Warning */}
      {priceImpact > 5 && (
        <Alert className="mb-4 bg-yellow-500/10 border-yellow-500/30">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-200">
            High price impact. Consider reducing trade size.
          </AlertDescription>
        </Alert>
      )}

      {/* Balance Display */}
      {authenticated && action === 'buy' && (
        <div className="text-sm text-neutral-400 mb-4">
          Balance: ${userBalance.toFixed(2)} USDC
        </div>
      )}

      {/* Execute Button */}
      {!authenticated ? (
        <Button onClick={() => login()} className="w-full bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25">
          Login to Trade
        </Button>
      ) : needsApproval && action === 'buy' ? (
        <Button
          onClick={() => approve(parseUnits('1000000', 6))}
          disabled={isApproving || !shares || shares <= 0}
          className="w-full bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25"
        >
          {isApproving ? 'Approving...' : 'Approve USDC'}
        </Button>
      ) : (
        <Button
          onClick={handleTrade}
          disabled={
            isLoading ||
            isTrading ||
            !shares ||
            shares <= 0 ||
            insufficientBalance ||
            insufficientShares
          }
          className={`w-full ${
            side === 'yes' ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/25' : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/25'
          }`}
        >
          {isTrading
            ? `${action === 'buy' ? 'Buying' : 'Selling'}...`
            : insufficientBalance
            ? 'Insufficient Balance'
            : insufficientShares
            ? 'Insufficient Shares'
            : `${action === 'buy' ? 'Buy' : 'Sell'} ${side.toUpperCase()}`}
        </Button>
      )}

      {/* User Positions */}
      {authenticated && address && (yesBalance > 0 || noBalance > 0) && (
        <div className="mt-6 pt-6 border-t border-neutral-800">
          <h3 className="text-lg font-semibold text-white mb-4">Your Positions</h3>
          <PositionDisplay
            yesBalance={yesBalance}
            noBalance={noBalance}
            yesPrice={market.yesPrice}
            noPrice={market.noPrice}
            resolved={market.resolved}
            outcome={market.outcome}
            claimable={claimable}
          />
        </div>
      )}
    </Card>
  );
}
