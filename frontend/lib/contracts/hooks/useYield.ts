'use client';

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { usePublicClient } from 'wagmi';
import { encodeFunctionData } from 'viem';
import { mantleSepoliaContracts, areContractsDeployed, MANTLE_SEPOLIA_CHAIN_ID } from '../deployments';
import { YieldVaultABI } from '../abis';
import { toast } from 'sonner';
import { getTransactionErrorMessage, toastTxSuccess } from '@/lib/utils/transaction';
import type { YieldInfo } from '@/types';

interface UseYieldReturn {
  claimable: bigint;
  yieldInfo: YieldInfo | null;
  isClaiming: boolean;
  claim: (projectId: string) => Promise<void>;
  refetch: () => void;
}

export function useYield(projectId?: string): UseYieldReturn {
  const { authenticated, sendTransaction } = usePrivy();
  const { wallets } = useWallets();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();

  const [isClaiming, setIsClaiming] = useState(false);

  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
  const userAddress = embeddedWallet?.address as `0x${string}` | undefined;

  // Query claimable yield for this project
  const { data: claimable = BigInt(0), refetch: refetchClaimable } = useQuery({
    queryKey: ['claimableYield', projectId, userAddress],
    queryFn: async () => {
      if (!publicClient || !userAddress || !projectId || !areContractsDeployed(MANTLE_SEPOLIA_CHAIN_ID)) {
        return BigInt(0);
      }

      try {
        const result = await publicClient.readContract({
          address: mantleSepoliaContracts.yieldVault,
          abi: YieldVaultABI,
          functionName: 'claimableYield',
          args: [projectId as `0x${string}`, userAddress],
        });
        return result as bigint;
      } catch {
        return BigInt(0);
      }
    },
    enabled: !!userAddress && !!publicClient && !!projectId && authenticated,
    staleTime: 30 * 1000,
  });

  // Query yield info for this project
  const { data: yieldInfo = null, refetch: refetchYieldInfo } = useQuery({
    queryKey: ['yieldInfo', projectId],
    queryFn: async (): Promise<YieldInfo | null> => {
      if (!publicClient || !projectId || !areContractsDeployed(MANTLE_SEPOLIA_CHAIN_ID)) {
        return null;
      }

      try {
        const [totalRevenue, distributed, apy] = await publicClient.readContract({
          address: mantleSepoliaContracts.yieldVault,
          abi: YieldVaultABI,
          functionName: 'getProjectYieldInfo',
          args: [projectId as `0x${string}`],
        }) as [bigint, bigint, bigint];

        return {
          projectId,
          totalRevenue: Number(totalRevenue) / 1e6, // USDC decimals
          distributed: Number(distributed) / 1e6,
          apy: Number(apy) / 100, // Percentage with 2 decimals
          claimable: Number(claimable) / 1e6,
        };
      } catch {
        return null;
      }
    },
    enabled: !!publicClient && !!projectId,
    staleTime: 60 * 1000,
  });

  // Claim yield
  const claim = useCallback(async (projectId: string) => {
    if (!embeddedWallet || !authenticated) {
      toast.error('Please login first');
      return;
    }

    if (!areContractsDeployed(MANTLE_SEPOLIA_CHAIN_ID)) {
      toast.error('Contracts not deployed');
      return;
    }

    setIsClaiming(true);

    try {
      const data = encodeFunctionData({
        abi: YieldVaultABI,
        functionName: 'claimYield',
        args: [projectId as `0x${string}`],
      });

      const txResult = await sendTransaction({
        to: mantleSepoliaContracts.yieldVault,
        data,
      });

      // Privy's sendTransaction returns { hash: string } or the hash directly
      const txHash = typeof txResult === 'string' ? txResult : txResult.hash || (txResult as any).transactionHash;
      toastTxSuccess('Yield claimed successfully!', txHash);

      // Refetch relevant data
      refetchClaimable();
      refetchYieldInfo();
      queryClient.invalidateQueries({ queryKey: ['usdcBalance'] });
    } catch (error) {
      console.error('Claim error:', error);
      toast.error(getTransactionErrorMessage(error));
    } finally {
      setIsClaiming(false);
    }
  }, [embeddedWallet, authenticated, sendTransaction, refetchClaimable, refetchYieldInfo, queryClient]);

  const refetch = useCallback(() => {
    refetchClaimable();
    refetchYieldInfo();
  }, [refetchClaimable, refetchYieldInfo]);

  return {
    claimable,
    yieldInfo,
    isClaiming,
    claim,
    refetch,
  };
}

// Hook to get total claimable yield across all projects
export function useTotalClaimableYield(projectIds: string[]) {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const publicClient = usePublicClient();

  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
  const userAddress = embeddedWallet?.address as `0x${string}` | undefined;

  return useQuery({
    queryKey: ['totalClaimableYield', projectIds, userAddress],
    queryFn: async () => {
      if (!publicClient || !userAddress || !areContractsDeployed(MANTLE_SEPOLIA_CHAIN_ID)) {
        return BigInt(0);
      }

      let total = BigInt(0);

      for (const projectId of projectIds) {
        try {
          const claimable = await publicClient.readContract({
            address: mantleSepoliaContracts.yieldVault,
            abi: YieldVaultABI,
            functionName: 'claimableYield',
            args: [projectId as `0x${string}`, userAddress],
          }) as bigint;
          total += claimable;
        } catch {
          // Ignore errors for individual projects
        }
      }

      return total;
    },
    enabled: !!userAddress && !!publicClient && projectIds.length > 0 && authenticated,
    staleTime: 30 * 1000,
  });
}
