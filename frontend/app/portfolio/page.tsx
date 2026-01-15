'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PortfolioStats, BondList, PositionList } from '@/components/portfolio';
import { usePortfolio } from '@/lib/hooks';
import { useYield } from '@/lib/contracts/hooks';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

function PortfolioContent() {
  const { authenticated, login } = usePrivy();
  const [activeTab, setActiveTab] = useState<'bonds' | 'positions'>('bonds');
  const [isClaimingAll, setIsClaimingAll] = useState(false);

  const {
    totalBondValue,
    totalClaimableYield,
    averageAPY,
    totalPositionValue,
    holdings,
    positions,
    isLoading,
    refetch,
  } = usePortfolio();

  const { claim } = useYield();

  const handleClaimAll = useCallback(async () => {
    if (holdings.length === 0) return;

    setIsClaimingAll(true);
    const claimableHoldings = holdings.filter(h => h.claimableYield > 0);

    if (claimableHoldings.length === 0) {
      toast.info('No yield to claim');
      setIsClaimingAll(false);
      return;
    }

    try {
      toast.loading(`Claiming yield from ${claimableHoldings.length} project(s)...`, { id: 'claim-all' });

      for (const holding of claimableHoldings) {
        await claim(holding.projectId);
      }

      toast.success('All yield claimed successfully!', { id: 'claim-all' });
      refetch();
    } catch (error) {
      console.error('Claim all error:', error);
      toast.error('Failed to claim all yield', { id: 'claim-all' });
    } finally {
      setIsClaimingAll(false);
    }
  }, [holdings, claim, refetch]);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Card className="p-8 bg-neutral-900/50 border-neutral-800 text-center max-w-md">
          <h1 className="text-2xl font-bold text-white mb-4">Your Portfolio</h1>
          <p className="text-neutral-400 mb-6">
            Login to view your bond holdings and prediction market positions.
          </p>
          <Button onClick={login} className="bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25">
            Login to View Portfolio
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white">My Portfolio</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
            className="border-neutral-700 text-white hover:bg-neutral-800"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <span className="ml-3 text-neutral-400">Loading portfolio...</span>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="mb-8">
              <PortfolioStats
                totalBondValue={totalBondValue}
                totalClaimableYield={totalClaimableYield}
                averageAPY={averageAPY}
                totalPositionValue={totalPositionValue}
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={activeTab === 'bonds' ? 'default' : 'outline'}
                onClick={() => setActiveTab('bonds')}
                className={activeTab === 'bonds' ? 'bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25' : 'border-neutral-700 text-white'}
              >
                Bond Holdings
                {holdings.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                    {holdings.length}
                  </span>
                )}
              </Button>
              <Button
                variant={activeTab === 'positions' ? 'default' : 'outline'}
                onClick={() => setActiveTab('positions')}
                className={activeTab === 'positions' ? 'bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25' : 'border-neutral-700 text-white'}
              >
                Prediction Positions
                {positions.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                    {positions.length}
                  </span>
                )}
              </Button>
            </div>

            {/* Tab Content */}
            {activeTab === 'bonds' && (
              <BondList holdings={holdings} onClaimSuccess={refetch} />
            )}

            {activeTab === 'positions' && (
              <PositionList positions={positions} onClaimSuccess={refetch} />
            )}

            {/* Claim All Button */}
            {activeTab === 'bonds' && totalClaimableYield > 0 && (
              <div className="mt-6">
                <Button
                  onClick={handleClaimAll}
                  disabled={isClaimingAll}
                  className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/25"
                >
                  {isClaimingAll ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Claiming All...
                    </>
                  ) : (
                    `Claim All Yield: $${totalClaimableYield.toFixed(2)}`
                  )}
                </Button>
              </div>
            )}

            {/* Empty States */}
            {holdings.length === 0 && positions.length === 0 && (
              <Card className="p-8 bg-neutral-900/50 border-neutral-800 text-center mt-8">
                <h3 className="text-xl font-semibold text-white mb-2">Start Your Investment Journey</h3>
                <p className="text-neutral-400 mb-6">
                  You haven't invested in any projects yet. Browse our infrastructure projects to start earning yield.
                </p>
                <div className="flex gap-4 justify-center">
                  <Link href="/projects">
                    <Button className="bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25">
                      Browse Projects
                    </Button>
                  </Link>
                  <Link href="/markets">
                    <Button variant="outline" className="border-neutral-700 text-white hover:bg-neutral-800">
                      Explore Markets
                    </Button>
                  </Link>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render on client side to avoid SSG issues with providers
  if (!isClient) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return <PortfolioContent />;
}
