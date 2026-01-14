'use client';

import { useQuery } from '@tanstack/react-query';
import { subgraphClient } from '@/lib/subgraph/client';
import { GET_ALL_MARKETS, GET_MARKET, GET_MARKET_BY_PROJECT } from '@/lib/subgraph/queries';
import type { Market } from '@/types/market';

// Transform subgraph response to frontend type
function transformMarket(raw: any): Market {
  return {
    id: raw.id,
    address: raw.id as `0x${string}`,
    projectId: raw.project?.id || '',
    projectName: raw.project?.name || 'Unknown Project',
    question: raw.question || '',
    yesPrice: raw.yesPrice ? parseFloat(raw.yesPrice) : 0.5,
    noPrice: raw.noPrice ? parseFloat(raw.noPrice) : 0.5,
    yesShares: Number(raw.yesPool) / 1e18,
    noShares: Number(raw.noPool) / 1e18,
    liquidity: Math.sqrt(Number(raw.yesPool) * Number(raw.noPool)) / 1e18,
    resolutionTime: raw.resolvedAt ? Number(raw.resolvedAt) * 1000 : Date.now() + 365 * 24 * 60 * 60 * 1000,
    resolved: raw.resolved || false,
    outcome: raw.outcome,
    totalVolume: Number(raw.totalVolume) / 1e6,
    yesTokenAddress: `0x0000000000000000000000000000000000000000` as `0x${string}`,
    noTokenAddress: `0x0000000000000000000000000000000000000000` as `0x${string}`,
    collateralAddress: `0x0000000000000000000000000000000000000000` as `0x${string}`,
  };
}

export function useMarkets() {
  return useQuery({
    queryKey: ['markets'],
    queryFn: async (): Promise<Market[]> => {
      try {
        const data = await subgraphClient.request(GET_ALL_MARKETS);
        const markets = (data as any).markets || [];
        return markets.map(transformMarket);
      } catch (error) {
        console.error('Error fetching markets from subgraph:', error);
        return [];
      }
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useMarketByProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ['market', 'project', projectId],
    queryFn: async (): Promise<Market | null> => {
      if (!projectId) return null;

      try {
        const data = await subgraphClient.request(GET_MARKET_BY_PROJECT, { projectId });
        const markets = (data as any).markets || [];
        return markets.length > 0 ? transformMarket(markets[0]) : null;
      } catch (error) {
        console.error('Error fetching market by project:', error);
        return null;
      }
    },
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });
}

export function useMarketsByProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ['markets', 'project', projectId],
    queryFn: async (): Promise<Market[]> => {
      if (!projectId) return [];

      try {
        const data = await subgraphClient.request(GET_MARKET_BY_PROJECT, { projectId });
        const markets = (data as any).markets || [];
        return markets.map(transformMarket);
      } catch (error) {
        console.error('Error fetching markets by project:', error);
        return [];
      }
    },
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });
}

export function useMarket(marketId: string | undefined) {
  return useQuery({
    queryKey: ['market', marketId],
    queryFn: async (): Promise<Market | null> => {
      if (!marketId) return null;

      try {
        const data = await subgraphClient.request(GET_MARKET, { id: marketId });
        const market = (data as any).market;
        return market ? transformMarket(market) : null;
      } catch (error) {
        console.error('Error fetching market:', error);
        return null;
      }
    },
    enabled: !!marketId,
    staleTime: 30 * 1000,
  });
}
