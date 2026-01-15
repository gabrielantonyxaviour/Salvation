'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, ExternalLink } from 'lucide-react';
import { PriceBar, TradingPanel } from '@/components/markets';
import { subgraphClient } from '@/lib/subgraph/client';
import { useMarket as useMarketContract } from '@/lib/contracts/hooks/useMarket';
import { getContracts } from '@/lib/contracts/deployments';
import { formatDistanceToNow } from 'date-fns';

// Extended query to get full market data with trades
const GET_MARKET_FULL = `
  query GetMarketFull($id: ID!) {
    market(id: $id) {
      id
      question
      yesPrice
      noPrice
      yesPool
      noPool
      totalVolume
      resolved
      outcome
      createdAt
      resolvedAt
      project {
        id
        name
        category
        status
        fundingGoal
        fundingRaised
        imageUrl
      }
      trades(first: 50, orderBy: timestamp, orderDirection: desc) {
        id
        trader
        isYes
        isBuy
        amount
        cost
        timestamp
      }
    }
  }
`;

interface Trade {
  id: string;
  trader: string;
  isYes: boolean;
  isBuy: boolean;
  amount: string;
  cost: string;
  timestamp: string;
}

interface MarketData {
  id: string;
  question: string;
  yesPrice: string;
  noPrice: string;
  yesPool: string;
  noPool: string;
  totalVolume: string;
  resolved: boolean;
  outcome?: boolean;
  createdAt: string;
  resolvedAt?: string;
  project: {
    id: string;
    name: string;
    category: string;
    status: string;
    fundingGoal: string;
    fundingRaised: string;
    imageUrl?: string;
  };
  trades: Trade[];
}

interface MarketDetailPageContentProps {
  marketId: string;
}

export default function MarketDetailPageContent({ marketId }: MarketDetailPageContentProps) {
  const contracts = getContracts(5003); // Mantle Sepolia

  // Fetch market data from subgraph
  const { data: marketData, isLoading, error } = useQuery({
    queryKey: ['market-full', marketId],
    queryFn: async () => {
      const response = await subgraphClient.request(GET_MARKET_FULL, { id: marketId });
      return (response as any).market as MarketData | null;
    },
    enabled: !!marketId,
    staleTime: 10 * 1000,
    refetchInterval: 30 * 1000, // Refetch every 30s
  });

  // Get live prices from contract
  const { market: liveMarket, yesPrice: liveYesPrice, noPrice: liveNoPrice } = useMarketContract(
    marketId as `0x${string}`
  );

  // Use live prices if available, otherwise subgraph
  const yesPrice = liveYesPrice || (marketData ? parseFloat(marketData.yesPrice) : 0.5);
  const noPrice = liveNoPrice || (marketData ? parseFloat(marketData.noPrice) : 0.5);

  // Calculate stats
  const stats = useMemo(() => {
    if (!marketData) return null;

    const yesPoolNum = Number(marketData.yesPool) / 1e18;
    const noPoolNum = Number(marketData.noPool) / 1e18;
    const totalVolumeNum = Number(marketData.totalVolume) / 1e6;
    const tradeCount = marketData.trades.length;

    // Calculate unique traders
    const uniqueTraders = new Set(marketData.trades.map(t => t.trader)).size;

    // Calculate 24h volume (trades in last 24h)
    const oneDayAgo = Date.now() / 1000 - 86400;
    const recentTrades = marketData.trades.filter(t => Number(t.timestamp) > oneDayAgo);
    const volume24h = recentTrades.reduce((sum, t) => sum + Number(t.cost) / 1e6, 0);

    return {
      yesPool: yesPoolNum,
      noPool: noPoolNum,
      totalVolume: totalVolumeNum,
      tradeCount,
      uniqueTraders,
      volume24h,
      liquidity: Math.sqrt(yesPoolNum * noPoolNum),
    };
  }, [marketData]);

  // Calculate time info
  const timeInfo = useMemo(() => {
    if (!marketData) return { created: '', daysActive: 0 };

    const createdAt = new Date(Number(marketData.createdAt) * 1000);
    const daysActive = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    return {
      created: formatDistanceToNow(createdAt, { addSuffix: true }),
      daysActive,
    };
  }, [marketData]);

  // Build market object for TradingPanel
  const marketForTrading = useMemo(() => {
    if (!marketData || !liveMarket) return null;

    return {
      id: marketId,
      address: marketId as `0x${string}`,
      projectId: marketData.project.id,
      projectName: marketData.project.name,
      question: marketData.question,
      yesPrice,
      noPrice,
      yesShares: Number(marketData.yesPool) / 1e18,
      noShares: Number(marketData.noPool) / 1e18,
      liquidity: liveMarket.liquidity || 1000,
      resolutionTime: 0, // TODO: Get from contract
      resolved: marketData.resolved,
      outcome: marketData.outcome,
      totalVolume: Number(marketData.totalVolume) / 1e6,
      yesTokenAddress: liveMarket.yesTokenAddress,
      noTokenAddress: liveMarket.noTokenAddress,
      collateralAddress: contracts?.usdc || liveMarket.collateralAddress,
    };
  }, [marketData, liveMarket, marketId, yesPrice, noPrice, contracts]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-6 w-32 mb-6" />
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48 mb-8" />
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-2/3 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="lg:w-1/3">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error or not found state
  if (error || !marketData) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Market Not Found</h1>
          <p className="text-neutral-400 mb-4">The market you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/markets" className="text-orange-400 hover:text-orange-300">
            Back to Markets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="container mx-auto px-4 py-8">
        {/* Project link & Category */}
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/projects/${marketData.project.id}`} className="text-orange-400 hover:text-orange-300">
            {marketData.project.name} →
          </Link>
          <Badge variant="outline" className="border-neutral-700 text-neutral-400">
            {marketData.project.category || 'Infrastructure'}
          </Badge>
        </div>

        {/* Question */}
        <div className="mb-2">
          <h1 className="text-xl md:text-2xl font-bold text-white">{marketData.question}</h1>
        </div>
        <p className="text-neutral-400 mb-8">
          Created {timeInfo.created} • {timeInfo.daysActive} days active
        </p>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Market Info */}
          <div className="lg:w-2/3 space-y-6">
            {/* Price Display */}
            <Card className="p-4 md:p-6 bg-neutral-900/50 border-neutral-800">
              <h2 className="text-lg md:text-xl font-semibold text-white mb-4">Current Prediction</h2>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 font-medium text-base md:text-lg">YES</span>
                      <span className="text-xl md:text-2xl font-bold text-white">
                        {Math.round(yesPrice * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl md:text-2xl font-bold text-white">
                        {Math.round(noPrice * 100)}%
                      </span>
                      <span className="text-red-400 font-medium text-base md:text-lg">NO</span>
                    </div>
                  </div>
                  <PriceBar
                    yesPrice={yesPrice}
                    noPrice={noPrice}
                    size="lg"
                    showLabels={false}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-800">
                  <div className="text-center p-3 md:p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="text-xs md:text-sm text-neutral-400 mb-1">YES Price</p>
                    <p className="text-xl md:text-2xl font-semibold text-green-400">
                      ${yesPrice.toFixed(2)}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Pays $1.00 if YES
                    </p>
                  </div>
                  <div className="text-center p-3 md:p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <p className="text-xs md:text-sm text-neutral-400 mb-1">NO Price</p>
                    <p className="text-xl md:text-2xl font-semibold text-red-400">
                      ${noPrice.toFixed(2)}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Pays $1.00 if NO
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Market Statistics */}
            {stats && (
              <Card className="p-4 md:p-6 bg-neutral-900/50 border-neutral-800">
                <h2 className="text-lg md:text-xl font-semibold text-white mb-4">Market Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <div className="p-3 md:p-4 bg-neutral-800/50 rounded-lg">
                    <div className="flex items-center gap-2 text-neutral-400 text-xs md:text-sm mb-1">
                      <DollarSign className="w-4 h-4" />
                      Total Volume
                    </div>
                    <p className="text-lg md:text-xl font-semibold text-white">
                      ${stats.totalVolume.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 md:p-4 bg-neutral-800/50 rounded-lg">
                    <div className="flex items-center gap-2 text-neutral-400 text-xs md:text-sm mb-1">
                      <Activity className="w-4 h-4" />
                      24h Volume
                    </div>
                    <p className="text-lg md:text-xl font-semibold text-white">
                      ${stats.volume24h.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 md:p-4 bg-neutral-800/50 rounded-lg">
                    <div className="flex items-center gap-2 text-neutral-400 text-xs md:text-sm mb-1">
                      <TrendingUp className="w-4 h-4" />
                      Total Trades
                    </div>
                    <p className="text-lg md:text-xl font-semibold text-white">
                      {stats.tradeCount}
                    </p>
                  </div>
                  <div className="p-3 md:p-4 bg-neutral-800/50 rounded-lg">
                    <div className="flex items-center gap-2 text-neutral-400 text-xs md:text-sm mb-1">
                      <Users className="w-4 h-4" />
                      Traders
                    </div>
                    <p className="text-lg md:text-xl font-semibold text-white">
                      {stats.uniqueTraders}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4 mt-4">
                  <div className="p-3 md:p-4 bg-neutral-800/50 rounded-lg">
                    <div className="flex items-center gap-2 text-neutral-400 text-xs md:text-sm mb-1">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      YES Shares Outstanding
                    </div>
                    <p className="text-base md:text-lg font-semibold text-green-400">
                      {stats.yesPool.toFixed(4)}
                    </p>
                  </div>
                  <div className="p-3 md:p-4 bg-neutral-800/50 rounded-lg">
                    <div className="flex items-center gap-2 text-neutral-400 text-xs md:text-sm mb-1">
                      <TrendingDown className="w-4 h-4 text-red-400" />
                      NO Shares Outstanding
                    </div>
                    <p className="text-base md:text-lg font-semibold text-red-400">
                      {stats.noPool.toFixed(4)}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Recent Trades */}
            {marketData.trades.length > 0 && (
              <Card className="p-4 md:p-6 bg-neutral-900/50 border-neutral-800">
                <h2 className="text-lg md:text-xl font-semibold text-white mb-4">Recent Trades</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs md:text-sm text-neutral-400 border-b border-neutral-800">
                        <th className="pb-3 font-medium">Type</th>
                        <th className="pb-3 font-medium">Side</th>
                        <th className="pb-3 font-medium">Shares</th>
                        <th className="pb-3 font-medium">Cost</th>
                        <th className="pb-3 font-medium hidden md:table-cell">Trader</th>
                        <th className="pb-3 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs md:text-sm">
                      {marketData.trades.slice(0, 20).map((trade) => (
                        <tr key={trade.id} className="border-b border-neutral-800/50">
                          <td className="py-3">
                            <Badge
                              variant="outline"
                              className={
                                trade.isBuy
                                  ? 'border-green-500/30 text-green-400 bg-green-500/10'
                                  : 'border-red-500/30 text-red-400 bg-red-500/10'
                              }
                            >
                              {trade.isBuy ? 'BUY' : 'SELL'}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <span className={trade.isYes ? 'text-green-400' : 'text-red-400'}>
                              {trade.isYes ? 'YES' : 'NO'}
                            </span>
                          </td>
                          <td className="py-3 text-white">
                            {(Number(trade.amount) / 1e18).toFixed(4)}
                          </td>
                          <td className="py-3 text-white">
                            ${(Number(trade.cost) / 1e6).toFixed(4)}
                          </td>
                          <td className="py-3 hidden md:table-cell">
                            <a
                              href={`https://sepolia.mantlescan.xyz/address/${trade.trader}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-neutral-400 hover:text-orange-400 flex items-center gap-1"
                            >
                              {trade.trader.slice(0, 6)}...{trade.trader.slice(-4)}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                          <td className="py-3 text-neutral-400">
                            {formatDistanceToNow(new Date(Number(trade.timestamp) * 1000), { addSuffix: true })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {marketData.trades.length === 0 && (
                  <p className="text-center text-neutral-500 py-8">
                    No trades yet. Be the first to trade!
                  </p>
                )}
              </Card>
            )}

            {/* How It Works */}
            <Card className="p-4 md:p-6 bg-neutral-900/50 border-neutral-800">
              <h2 className="text-lg md:text-xl font-semibold text-white mb-4">How It Works</h2>
              <div className="space-y-4 text-neutral-300">
                <p className="text-sm md:text-base">
                  This is an <strong className="text-orange-400">LMSR (Logarithmic Market Scoring Rule)</strong> prediction market.
                  Prices reflect the market&apos;s collective confidence in each outcome.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-3 md:p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <h3 className="font-semibold text-green-400 mb-2">YES Shares</h3>
                    <p className="text-xs md:text-sm text-neutral-400">
                      Pay <strong className="text-white">$1.00</strong> if the outcome is YES, $0 otherwise.
                      Current price: ${yesPrice.toFixed(2)} per share.
                    </p>
                  </div>
                  <div className="p-3 md:p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <h3 className="font-semibold text-red-400 mb-2">NO Shares</h3>
                    <p className="text-xs md:text-sm text-neutral-400">
                      Pay <strong className="text-white">$1.00</strong> if the outcome is NO, $0 otherwise.
                      Current price: ${noPrice.toFixed(2)} per share.
                    </p>
                  </div>
                </div>
                <p className="text-xs md:text-sm text-neutral-400">
                  Prices are determined by the LMSR algorithm and automatically adjust based on trading activity.
                  The more confident the market is in an outcome, the higher that outcome&apos;s price.
                </p>
              </div>
            </Card>

            {/* Contract Info */}
            <Card className="p-4 md:p-6 bg-neutral-900/50 border-neutral-800">
              <h2 className="text-lg md:text-xl font-semibold text-white mb-4">Contract Details</h2>
              <div className="space-y-3 text-xs md:text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Market Contract</span>
                  <a
                    href={`https://sepolia.mantlescan.xyz/address/${marketId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-400 hover:text-orange-300 flex items-center gap-1"
                  >
                    {marketId.slice(0, 10)}...{marketId.slice(-8)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                {liveMarket?.yesTokenAddress && liveMarket.yesTokenAddress !== '0x0000000000000000000000000000000000000000' && (
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">YES Token</span>
                    <a
                      href={`https://sepolia.mantlescan.xyz/address/${liveMarket.yesTokenAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-400 hover:text-green-300 flex items-center gap-1"
                    >
                      {liveMarket.yesTokenAddress.slice(0, 10)}...{liveMarket.yesTokenAddress.slice(-8)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {liveMarket?.noTokenAddress && liveMarket.noTokenAddress !== '0x0000000000000000000000000000000000000000' && (
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">NO Token</span>
                    <a
                      href={`https://sepolia.mantlescan.xyz/address/${liveMarket.noTokenAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      {liveMarket.noTokenAddress.slice(0, 10)}...{liveMarket.noTokenAddress.slice(-8)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Trading Panel */}
          <div className="lg:w-1/3">
            <div className="sticky top-24">
              {marketForTrading ? (
                <TradingPanel market={marketForTrading} />
              ) : (
                <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                  <div className="text-center py-8">
                    <p className="text-neutral-400">Loading trading panel...</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
