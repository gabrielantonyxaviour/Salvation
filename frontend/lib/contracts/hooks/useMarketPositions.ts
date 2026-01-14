'use client';

import { useCallback } from 'react';
import { useReadContracts, useWriteContract } from 'wagmi';
import { formatUnits } from 'viem';
import { toast } from 'sonner';
import OutcomeTokenABI from '../abis/OutcomeToken.json';
import LMSRMarketABI from '../abis/LMSRMarket.json';

interface UseMarketPositionsParams {
  marketAddress: `0x${string}` | undefined;
  yesTokenAddress: `0x${string}` | undefined;
  noTokenAddress: `0x${string}` | undefined;
  userAddress: `0x${string}` | undefined;
  yesPrice: number;
  noPrice: number;
  resolved: boolean;
  outcome?: boolean;
}

interface UseMarketPositionsResult {
  yesBalance: number;
  noBalance: number;
  yesValue: number;
  noValue: number;
  claimable: number;
  claim: () => Promise<void>;
  loading: boolean;
  isClaiming: boolean;
  refetch: () => void;
}

export function useMarketPositions({
  marketAddress,
  yesTokenAddress,
  noTokenAddress,
  userAddress,
  yesPrice,
  noPrice,
  resolved,
  outcome,
}: UseMarketPositionsParams): UseMarketPositionsResult {
  // Read token balances
  const { data, isLoading, refetch } = useReadContracts({
    contracts: userAddress && yesTokenAddress && noTokenAddress ? [
      {
        address: yesTokenAddress,
        abi: OutcomeTokenABI,
        functionName: 'balanceOf',
        args: [userAddress],
      },
      {
        address: noTokenAddress,
        abi: OutcomeTokenABI,
        functionName: 'balanceOf',
        args: [userAddress],
      },
    ] : [],
    query: {
      enabled: !!userAddress && !!yesTokenAddress && !!noTokenAddress,
    },
  });

  // Read claimable winnings
  const { data: claimableData } = useReadContracts({
    contracts: userAddress && marketAddress ? [
      {
        address: marketAddress,
        abi: LMSRMarketABI,
        functionName: 'claimableWinnings',
        args: [userAddress],
      },
    ] : [],
    query: {
      enabled: !!userAddress && !!marketAddress && resolved,
    },
  });

  const { writeContractAsync, isPending: isClaiming } = useWriteContract();

  // Parse balances
  const yesBalance = data?.[0]?.result
    ? Number(formatUnits(data[0].result as bigint, 18))
    : 0;

  const noBalance = data?.[1]?.result
    ? Number(formatUnits(data[1].result as bigint, 18))
    : 0;

  // Calculate values
  const yesValue = yesBalance * yesPrice;
  const noValue = noBalance * noPrice;

  // Claimable amount
  const claimable = claimableData?.[0]?.result
    ? Number(formatUnits(claimableData[0].result as bigint, 18))
    : 0;

  // Claim winnings function
  const claim = useCallback(async () => {
    if (!marketAddress) {
      throw new Error('Missing market address');
    }

    if (!resolved) {
      throw new Error('Market not resolved');
    }

    if (claimable === 0) {
      throw new Error('Nothing to claim');
    }

    try {
      toast.loading('Claiming winnings...', { id: 'claim' });

      await writeContractAsync({
        address: marketAddress,
        abi: LMSRMarketABI,
        functionName: 'claimWinnings',
        args: [],
      });

      toast.success(`Successfully claimed $${claimable.toFixed(2)}!`, { id: 'claim' });

      // Refetch balances
      refetch();
    } catch (err) {
      toast.error('Failed to claim winnings', { id: 'claim' });
      throw err;
    }
  }, [marketAddress, resolved, claimable, writeContractAsync, refetch]);

  return {
    yesBalance,
    noBalance,
    yesValue,
    noValue,
    claimable,
    claim,
    loading: isLoading,
    isClaiming,
    refetch,
  };
}
