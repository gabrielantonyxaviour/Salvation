'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { formatUnits, createPublicClient, http } from 'viem';
import { mantleSepoliaContracts, areContractsDeployed, MANTLE_SEPOLIA_CHAIN_ID } from '../contracts/deployments';
import { BondFactoryABI, BondTokenABI, YieldVaultABI } from '../contracts/abis';
import LMSRMarketABI from '../contracts/abis/LMSRMarket.json';
import OutcomeTokenABI from '../contracts/abis/OutcomeToken.json';
import { useProjects } from '../contracts/hooks';
import type { BondHolding, MarketPosition, PortfolioSummary } from '@/types';

// Demo data for when contracts aren't deployed
const DEMO_BOND_HOLDINGS: BondHolding[] = [
  {
    projectId: '0x1',
    projectName: 'Kisumu Water Well',
    bondTokenAddress: '0x0000000000000000000000000000000000000001' as `0x${string}`,
    balance: 100,
    value: 100,
    apy: 12.5,
    claimableYield: 4.50,
    imageUrl: '/images/projects/water-well.jpg',
    category: 'water',
  },
  {
    projectId: '0x2',
    projectName: 'Lagos Solar Grid',
    bondTokenAddress: '0x0000000000000000000000000000000000000002' as `0x${string}`,
    balance: 200,
    value: 200,
    apy: 15.2,
    claimableYield: 8.00,
    imageUrl: '/images/projects/solar-grid.jpg',
    category: 'solar',
  },
];

const DEMO_MARKET_POSITIONS: MarketPosition[] = [
  {
    marketId: '0x1',
    marketAddress: '0x0000000000000000000000000000000000000001' as `0x${string}`,
    projectName: 'Kisumu Water Well',
    question: 'Will Kisumu Water Well be operational by Q2 2026?',
    yesBalance: 50,
    noBalance: 0,
    yesValue: 39,
    noValue: 0,
    resolved: false,
    claimable: 0,
  },
  {
    marketId: '0x3',
    marketAddress: '0x0000000000000000000000000000000000000003' as `0x${string}`,
    projectName: 'Ethiopia Coffee Cooperative',
    question: 'Will Ethiopia Coffee Cooperative complete funding by 2026?',
    yesBalance: 100,
    noBalance: 0,
    yesValue: 100,
    noValue: 0,
    resolved: true,
    outcome: true,
    won: true,
    claimable: 100,
  },
];

// Empty state for SSR
const EMPTY_PORTFOLIO: PortfolioSummary = {
  totalBondValue: 0,
  totalClaimableYield: 0,
  averageAPY: 0,
  totalPositionValue: 0,
  holdings: [],
  positions: [],
};

// Mantle Sepolia chain definition
const mantleSepolia = {
  id: 5003,
  name: 'Mantle Sepolia',
  nativeCurrency: {
    name: 'MNT',
    symbol: 'MNT',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc.sepolia.mantle.xyz'] },
  },
} as const;

export function usePortfolio() {
  const [isClient, setIsClient] = useState(false);
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { data: projects = [] } = useProjects();

  // Check if we're on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const embeddedWallet = wallets?.find(w => w.walletClientType === 'privy');
  const userAddress = embeddedWallet?.address as `0x${string}` | undefined;

  // Create a public client for reading data
  const publicClient = useMemo(() => {
    if (!isClient) return null;

    try {
      return createPublicClient({
        chain: mantleSepolia,
        transport: http('https://rpc.sepolia.mantle.xyz'),
      });
    } catch {
      return null;
    }
  }, [isClient]);

  // Fetch bond holdings across all projects
  const { data: bondHoldings = [], isLoading: isLoadingBonds, refetch: refetchBonds } = useQuery({
    queryKey: ['bondHoldings', userAddress, projects.map(p => p.id), isClient],
    queryFn: async (): Promise<BondHolding[]> => {
      if (!isClient || !publicClient || !userAddress || !areContractsDeployed(MANTLE_SEPOLIA_CHAIN_ID)) {
        // Return demo data
        return DEMO_BOND_HOLDINGS;
      }

      const holdings: BondHolding[] = [];

      for (const project of projects) {
        try {
          // Get bond token address for this project
          const bondTokenAddress = await publicClient.readContract({
            address: mantleSepoliaContracts.bondFactory,
            abi: BondFactoryABI,
            functionName: 'getBondToken',
            args: [project.id as `0x${string}`],
          }) as `0x${string}`;

          if (!bondTokenAddress || bondTokenAddress === '0x0000000000000000000000000000000000000000') {
            continue;
          }

          // Get user's bond balance
          const balance = await publicClient.readContract({
            address: bondTokenAddress,
            abi: BondTokenABI,
            functionName: 'balanceOf',
            args: [userAddress],
          }) as bigint;

          if (balance === BigInt(0)) continue;

          // Get claimable yield
          let claimableYield = 0;
          try {
            const claimable = await publicClient.readContract({
              address: mantleSepoliaContracts.yieldVault,
              abi: YieldVaultABI,
              functionName: 'claimableYield',
              args: [project.id as `0x${string}`, userAddress],
            }) as bigint;
            claimableYield = Number(formatUnits(claimable, 6)); // USDC decimals
          } catch {
            // Yield vault may not exist yet
          }

          const balanceNumber = Number(formatUnits(balance, 18)); // Bond tokens have 18 decimals

          holdings.push({
            projectId: project.id,
            projectName: project.name,
            bondTokenAddress,
            balance: balanceNumber,
            value: balanceNumber * project.bondPrice,
            apy: project.projectedAPY,
            claimableYield,
            imageUrl: project.imageUrl,
            category: project.category,
          });
        } catch (error) {
          console.error(`Error fetching bond for project ${project.id}:`, error);
        }
      }

      return holdings.length > 0 ? holdings : DEMO_BOND_HOLDINGS;
    },
    enabled: isClient && !!userAddress && authenticated && projects.length > 0,
    staleTime: 30 * 1000,
  });

  // Fetch market positions across all projects
  const { data: marketPositions = [], isLoading: isLoadingPositions, refetch: refetchPositions } = useQuery({
    queryKey: ['marketPositions', userAddress, projects.map(p => p.id), isClient],
    queryFn: async (): Promise<MarketPosition[]> => {
      if (!isClient || !publicClient || !userAddress || !areContractsDeployed(MANTLE_SEPOLIA_CHAIN_ID)) {
        return DEMO_MARKET_POSITIONS;
      }

      const positions: MarketPosition[] = [];

      for (const project of projects) {
        try {
          // Get market address for this project (if it exists)
          if (!project.marketAddress) continue;

          const marketAddress = project.marketAddress as `0x${string}`;

          // Get market info
          const [yesTokenAddress, noTokenAddress, resolved, outcome, yesPrice, noPrice] = await Promise.all([
            publicClient.readContract({
              address: marketAddress,
              abi: LMSRMarketABI,
              functionName: 'yesToken',
            }) as Promise<`0x${string}`>,
            publicClient.readContract({
              address: marketAddress,
              abi: LMSRMarketABI,
              functionName: 'noToken',
            }) as Promise<`0x${string}`>,
            publicClient.readContract({
              address: marketAddress,
              abi: LMSRMarketABI,
              functionName: 'resolved',
            }) as Promise<boolean>,
            publicClient.readContract({
              address: marketAddress,
              abi: LMSRMarketABI,
              functionName: 'outcome',
            }).catch(() => undefined) as Promise<boolean | undefined>,
            publicClient.readContract({
              address: marketAddress,
              abi: LMSRMarketABI,
              functionName: 'getYesPrice',
            }) as Promise<bigint>,
            publicClient.readContract({
              address: marketAddress,
              abi: LMSRMarketABI,
              functionName: 'getNoPrice',
            }) as Promise<bigint>,
          ]);

          // Get user's token balances
          const [yesBalance, noBalance] = await Promise.all([
            publicClient.readContract({
              address: yesTokenAddress,
              abi: OutcomeTokenABI,
              functionName: 'balanceOf',
              args: [userAddress],
            }) as Promise<bigint>,
            publicClient.readContract({
              address: noTokenAddress,
              abi: OutcomeTokenABI,
              functionName: 'balanceOf',
              args: [userAddress],
            }) as Promise<bigint>,
          ]);

          if (yesBalance === BigInt(0) && noBalance === BigInt(0)) continue;

          const yesBalanceNum = Number(formatUnits(yesBalance, 18));
          const noBalanceNum = Number(formatUnits(noBalance, 18));
          const yesPriceNum = Number(formatUnits(yesPrice, 18));
          const noPriceNum = Number(formatUnits(noPrice, 18));

          // Get claimable if resolved
          let claimable = 0;
          if (resolved) {
            try {
              const claimableResult = await publicClient.readContract({
                address: marketAddress,
                abi: LMSRMarketABI,
                functionName: 'claimableWinnings',
                args: [userAddress],
              }) as bigint;
              claimable = Number(formatUnits(claimableResult, 6)); // USDC decimals
            } catch {
              // May not have claimable function
            }
          }

          positions.push({
            marketId: project.id,
            marketAddress,
            projectName: project.name,
            question: `Will ${project.name} be operational by target date?`,
            yesBalance: yesBalanceNum,
            noBalance: noBalanceNum,
            yesValue: yesBalanceNum * yesPriceNum,
            noValue: noBalanceNum * noPriceNum,
            resolved,
            outcome,
            won: resolved ? (outcome ? yesBalanceNum > 0 : noBalanceNum > 0) : undefined,
            claimable,
          });
        } catch (error) {
          console.error(`Error fetching market position for project ${project.id}:`, error);
        }
      }

      return positions.length > 0 ? positions : DEMO_MARKET_POSITIONS;
    },
    enabled: isClient && !!userAddress && authenticated && projects.length > 0,
    staleTime: 30 * 1000,
  });

  // Calculate portfolio summary
  const summary: PortfolioSummary = useMemo(() => {
    if (!isClient) return EMPTY_PORTFOLIO;

    return {
      totalBondValue: bondHoldings.reduce((sum, h) => sum + h.value, 0),
      totalClaimableYield: bondHoldings.reduce((sum, h) => sum + h.claimableYield, 0),
      averageAPY: bondHoldings.length > 0
        ? bondHoldings.reduce((sum, h) => sum + h.apy * h.value, 0) /
          bondHoldings.reduce((sum, h) => sum + h.value, 0) || 0
        : 0,
      totalPositionValue: marketPositions.reduce((sum, p) => sum + p.yesValue + p.noValue, 0),
      holdings: bondHoldings,
      positions: marketPositions,
    };
  }, [isClient, bondHoldings, marketPositions]);

  const refetch = () => {
    refetchBonds();
    refetchPositions();
  };

  return {
    ...summary,
    isLoading: !isClient || isLoadingBonds || isLoadingPositions,
    refetch,
  };
}
