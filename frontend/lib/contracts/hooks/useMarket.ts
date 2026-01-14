'use client';

import { useReadContract, useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import LMSRMarketABI from '../abis/LMSRMarket.json';
import { Market } from '@/types/market';

const WAD = BigInt(1e18);

interface UseMarketResult {
  market: Market | null;
  yesPrice: number;
  noPrice: number;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useMarket(marketAddress: `0x${string}` | undefined): UseMarketResult {
  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: marketAddress ? [
      {
        address: marketAddress,
        abi: LMSRMarketABI,
        functionName: 'projectId',
      },
      {
        address: marketAddress,
        abi: LMSRMarketABI,
        functionName: 'question',
      },
      {
        address: marketAddress,
        abi: LMSRMarketABI,
        functionName: 'getYesPrice',
      },
      {
        address: marketAddress,
        abi: LMSRMarketABI,
        functionName: 'getNoPrice',
      },
      {
        address: marketAddress,
        abi: LMSRMarketABI,
        functionName: 'yesShares',
      },
      {
        address: marketAddress,
        abi: LMSRMarketABI,
        functionName: 'noShares',
      },
      {
        address: marketAddress,
        abi: LMSRMarketABI,
        functionName: 'b',
      },
      {
        address: marketAddress,
        abi: LMSRMarketABI,
        functionName: 'resolutionTime',
      },
      {
        address: marketAddress,
        abi: LMSRMarketABI,
        functionName: 'resolved',
      },
      {
        address: marketAddress,
        abi: LMSRMarketABI,
        functionName: 'outcome',
      },
      {
        address: marketAddress,
        abi: LMSRMarketABI,
        functionName: 'yesToken',
      },
      {
        address: marketAddress,
        abi: LMSRMarketABI,
        functionName: 'noToken',
      },
      {
        address: marketAddress,
        abi: LMSRMarketABI,
        functionName: 'collateral',
      },
    ] : [],
    query: {
      enabled: !!marketAddress,
    },
  });

  if (!marketAddress || !data || data.some(d => d.status === 'failure')) {
    return {
      market: null,
      yesPrice: 0,
      noPrice: 0,
      loading: isLoading,
      error: error ?? null,
      refetch,
    };
  }

  const [
    projectIdResult,
    questionResult,
    yesPriceResult,
    noPriceResult,
    yesSharesResult,
    noSharesResult,
    bResult,
    resolutionTimeResult,
    resolvedResult,
    outcomeResult,
    yesTokenResult,
    noTokenResult,
    collateralResult,
  ] = data;

  const yesPrice = Number(formatUnits(yesPriceResult?.result as bigint || BigInt(0), 18));
  const noPrice = Number(formatUnits(noPriceResult?.result as bigint || BigInt(0), 18));

  const market: Market = {
    id: marketAddress,
    address: marketAddress,
    projectId: projectIdResult?.result as string || '',
    projectName: '', // Would need to fetch from ProjectRegistry
    question: questionResult?.result as string || '',
    yesPrice,
    noPrice,
    yesShares: Number(formatUnits(yesSharesResult?.result as bigint || BigInt(0), 18)),
    noShares: Number(formatUnits(noSharesResult?.result as bigint || BigInt(0), 18)),
    liquidity: Number(formatUnits(bResult?.result as bigint || BigInt(0), 18)),
    resolutionTime: Number(resolutionTimeResult?.result || 0),
    resolved: resolvedResult?.result as boolean || false,
    outcome: outcomeResult?.result as boolean | undefined,
    totalVolume: 0, // Would need to calculate from events
    yesTokenAddress: yesTokenResult?.result as `0x${string}` || '0x0' as `0x${string}`,
    noTokenAddress: noTokenResult?.result as `0x${string}` || '0x0' as `0x${string}`,
    collateralAddress: collateralResult?.result as `0x${string}` || '0x0' as `0x${string}`,
  };

  return {
    market,
    yesPrice,
    noPrice,
    loading: isLoading,
    error: error ?? null,
    refetch,
  };
}
