'use client';

import { useState, useCallback, useMemo } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { toast } from 'sonner';
import { getTransactionErrorMessage } from '@/lib/utils/transaction';
import LMSRMarketABI from '../abis/LMSRMarket.json';
import ERC20ABI from '../abis/ERC20.json';
import { calculateCost, calculateReturn, calculatePriceImpact } from '@/lib/utils/lmsr';
import type { TradeSide, TradeAction } from '@/types/market';

interface UseMarketTradeParams {
  marketAddress: `0x${string}` | undefined;
  collateralAddress: `0x${string}` | undefined;
  userAddress: `0x${string}` | undefined;
  yesShares: number;
  noShares: number;
  liquidity: number;
}

interface UseMarketTradeResult {
  buy: (side: TradeSide, shares: number) => Promise<void>;
  sell: (side: TradeSide, shares: number) => Promise<void>;
  approve: (amount: bigint) => Promise<void>;
  quote: (side: TradeSide, action: TradeAction, shares: number) => {
    cost: number;
    priceImpact: number;
  };
  needsApproval: boolean;
  allowance: bigint;
  isLoading: boolean;
  isApproving: boolean;
  isTrading: boolean;
  error: Error | null;
}

export function useMarketTrade({
  marketAddress,
  collateralAddress,
  userAddress,
  yesShares,
  noShares,
  liquidity,
}: UseMarketTradeParams): UseMarketTradeResult {
  const [pendingAction, setPendingAction] = useState<'approve' | 'buy' | 'sell' | null>(null);

  // Read allowance
  const { data: allowance = BigInt(0), refetch: refetchAllowance } = useReadContract({
    address: collateralAddress,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: userAddress && marketAddress ? [userAddress, marketAddress] : undefined,
    query: {
      enabled: !!userAddress && !!marketAddress && !!collateralAddress,
    },
  }) as { data: bigint | undefined; refetch: () => void };

  // Write contract
  const { writeContractAsync, isPending: isWriting, error: writeError } = useWriteContract();

  // Quote function - calculates cost/return for a trade
  const quote = useCallback((side: TradeSide, action: TradeAction, shares: number) => {
    if (!liquidity || liquidity === 0 || shares === 0) {
      return { cost: 0, priceImpact: 0 };
    }

    const isYes = side === 'yes';

    if (action === 'buy') {
      const cost = calculateCost(isYes, shares, yesShares, noShares, liquidity);
      const priceImpact = calculatePriceImpact(isYes, shares, yesShares, noShares, liquidity);
      return { cost, priceImpact };
    } else {
      const returnValue = calculateReturn(isYes, shares, yesShares, noShares, liquidity);
      const priceImpact = calculatePriceImpact(isYes, -shares, yesShares, noShares, liquidity);
      return { cost: returnValue, priceImpact };
    }
  }, [yesShares, noShares, liquidity]);

  // Approve function
  const approve = useCallback(async (amount: bigint) => {
    if (!collateralAddress || !marketAddress) {
      throw new Error('Missing contract addresses');
    }

    setPendingAction('approve');
    try {
      const hash = await writeContractAsync({
        address: collateralAddress,
        abi: ERC20ABI,
        functionName: 'approve',
        args: [marketAddress, amount],
      });

      toast.loading('Approving USDC...', { id: 'approve' });

      // Wait for confirmation
      await new Promise(resolve => setTimeout(resolve, 2000));
      await refetchAllowance();

      toast.success('USDC approved!', { id: 'approve' });
    } catch (err) {
      toast.error(getTransactionErrorMessage(err), { id: 'approve' });
      throw err;
    } finally {
      setPendingAction(null);
    }
  }, [collateralAddress, marketAddress, writeContractAsync, refetchAllowance]);

  // Buy function
  const buy = useCallback(async (side: TradeSide, shares: number) => {
    if (!marketAddress) {
      throw new Error('Missing market address');
    }

    const sharesWad = parseUnits(shares.toString(), 18);

    setPendingAction('buy');
    try {
      const functionName = side === 'yes' ? 'buyYes' : 'buyNo';

      toast.loading(`Buying ${side.toUpperCase()} shares...`, { id: 'trade' });

      const hash = await writeContractAsync({
        address: marketAddress,
        abi: LMSRMarketABI,
        functionName,
        args: [sharesWad],
      });

      toast.success(`Successfully bought ${shares} ${side.toUpperCase()} shares!`, { id: 'trade' });
    } catch (err) {
      toast.error(getTransactionErrorMessage(err), { id: 'trade' });
      throw err;
    } finally {
      setPendingAction(null);
    }
  }, [marketAddress, writeContractAsync]);

  // Sell function
  const sell = useCallback(async (side: TradeSide, shares: number) => {
    if (!marketAddress) {
      throw new Error('Missing market address');
    }

    const sharesWad = parseUnits(shares.toString(), 18);

    setPendingAction('sell');
    try {
      const functionName = side === 'yes' ? 'sellYes' : 'sellNo';

      toast.loading(`Selling ${side.toUpperCase()} shares...`, { id: 'trade' });

      const hash = await writeContractAsync({
        address: marketAddress,
        abi: LMSRMarketABI,
        functionName,
        args: [sharesWad],
      });

      toast.success(`Successfully sold ${shares} ${side.toUpperCase()} shares!`, { id: 'trade' });
    } catch (err) {
      toast.error(getTransactionErrorMessage(err), { id: 'trade' });
      throw err;
    } finally {
      setPendingAction(null);
    }
  }, [marketAddress, writeContractAsync]);

  // Check if approval is needed for a given amount
  const needsApproval = useMemo(() => {
    return allowance === BigInt(0);
  }, [allowance]);

  return {
    buy,
    sell,
    approve,
    quote,
    needsApproval,
    allowance: allowance ?? BigInt(0),
    isLoading: isWriting,
    isApproving: pendingAction === 'approve',
    isTrading: pendingAction === 'buy' || pendingAction === 'sell',
    error: writeError ?? null,
  };
}
