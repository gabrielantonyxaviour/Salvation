'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { usePublicClient } from 'wagmi';
import { encodeFunctionData, parseUnits, formatUnits } from 'viem';
import { mantleSepoliaContracts, areContractsDeployed, MANTLE_SEPOLIA_CHAIN_ID } from '../deployments';
import { BondFactoryABI, ERC20ABI, BondTokenABI } from '../abis';
import { toast } from 'sonner';
import { getTransactionErrorMessage } from '@/lib/utils/transaction';

interface UseBondPurchaseReturn {
  allowance: bigint;
  bondBalance: bigint;
  isApproving: boolean;
  isPurchasing: boolean;
  approve: (amount: bigint) => Promise<void>;
  purchase: (projectId: string, usdcAmount: bigint) => Promise<void>;
  refetch: () => void;
}

export function useBondPurchase(projectId?: string): UseBondPurchaseReturn {
  const { authenticated, sendTransaction } = usePrivy();
  const { wallets } = useWallets();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();

  const [isApproving, setIsApproving] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
  const userAddress = embeddedWallet?.address as `0x${string}` | undefined;

  // Query USDC allowance for BondFactory
  const { data: allowance = BigInt(0), refetch: refetchAllowance } = useQuery({
    queryKey: ['usdcAllowance', userAddress],
    queryFn: async () => {
      if (!publicClient || !userAddress || !areContractsDeployed(MANTLE_SEPOLIA_CHAIN_ID)) {
        return BigInt(0);
      }

      try {
        const result = await publicClient.readContract({
          address: mantleSepoliaContracts.usdc,
          abi: ERC20ABI,
          functionName: 'allowance',
          args: [userAddress, mantleSepoliaContracts.bondFactory],
        });
        return result as bigint;
      } catch {
        return BigInt(0);
      }
    },
    enabled: !!userAddress && !!publicClient && authenticated,
    staleTime: 10 * 1000,
  });

  // Query user's bond balance for this project
  const { data: bondBalance = BigInt(0), refetch: refetchBondBalance } = useQuery({
    queryKey: ['bondBalance', projectId, userAddress],
    queryFn: async () => {
      if (!publicClient || !userAddress || !projectId || !areContractsDeployed(MANTLE_SEPOLIA_CHAIN_ID)) {
        return BigInt(0);
      }

      try {
        // First get the bond token address for this project
        const bondTokenAddress = await publicClient.readContract({
          address: mantleSepoliaContracts.bondFactory,
          abi: BondFactoryABI,
          functionName: 'getBondToken',
          args: [projectId as `0x${string}`],
        }) as `0x${string}`;

        if (!bondTokenAddress || bondTokenAddress === '0x0000000000000000000000000000000000000000') {
          return BigInt(0);
        }

        // Then get balance
        const balance = await publicClient.readContract({
          address: bondTokenAddress,
          abi: BondTokenABI,
          functionName: 'balanceOf',
          args: [userAddress],
        });
        return balance as bigint;
      } catch {
        return BigInt(0);
      }
    },
    enabled: !!userAddress && !!publicClient && !!projectId && authenticated,
    staleTime: 10 * 1000,
  });

  // Approve USDC spending
  const approve = useCallback(async (amount: bigint) => {
    if (!embeddedWallet || !authenticated) {
      toast.error('Please login first');
      return;
    }

    if (!areContractsDeployed(MANTLE_SEPOLIA_CHAIN_ID)) {
      toast.error('Contracts not deployed');
      return;
    }

    setIsApproving(true);

    try {
      const data = encodeFunctionData({
        abi: ERC20ABI,
        functionName: 'approve',
        args: [mantleSepoliaContracts.bondFactory, amount],
      });

      await sendTransaction({
        to: mantleSepoliaContracts.usdc,
        data,
      });

      toast.success('USDC approved!');
      refetchAllowance();
    } catch (error) {
      console.error('Approve error:', error);
      toast.error(getTransactionErrorMessage(error));
    } finally {
      setIsApproving(false);
    }
  }, [embeddedWallet, authenticated, sendTransaction, refetchAllowance]);

  // Purchase bonds
  const purchase = useCallback(async (projectId: string, usdcAmount: bigint) => {
    if (!embeddedWallet || !authenticated) {
      toast.error('Please login first');
      return;
    }

    if (!areContractsDeployed(MANTLE_SEPOLIA_CHAIN_ID)) {
      toast.error('Contracts not deployed');
      return;
    }

    setIsPurchasing(true);

    try {
      const data = encodeFunctionData({
        abi: BondFactoryABI,
        functionName: 'purchaseBonds',
        args: [projectId as `0x${string}`, usdcAmount],
      });

      await sendTransaction({
        to: mantleSepoliaContracts.bondFactory,
        data,
      });

      toast.success('Bonds purchased successfully!');

      // Refetch relevant data
      refetchAllowance();
      refetchBondBalance();
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error(getTransactionErrorMessage(error));
    } finally {
      setIsPurchasing(false);
    }
  }, [embeddedWallet, authenticated, sendTransaction, refetchAllowance, refetchBondBalance, queryClient]);

  const refetch = useCallback(() => {
    refetchAllowance();
    refetchBondBalance();
  }, [refetchAllowance, refetchBondBalance]);

  return {
    allowance,
    bondBalance,
    isApproving,
    isPurchasing,
    approve,
    purchase,
    refetch,
  };
}

// Hook to get USDC balance
export function useUSDCBalance() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const publicClient = usePublicClient();

  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
  const userAddress = embeddedWallet?.address as `0x${string}` | undefined;

  return useQuery({
    queryKey: ['usdcBalance', userAddress],
    queryFn: async () => {
      if (!publicClient || !userAddress || !areContractsDeployed(MANTLE_SEPOLIA_CHAIN_ID)) {
        return BigInt(0);
      }

      try {
        const balance = await publicClient.readContract({
          address: mantleSepoliaContracts.usdc,
          abi: ERC20ABI,
          functionName: 'balanceOf',
          args: [userAddress],
        });
        return balance as bigint;
      } catch {
        return BigInt(0);
      }
    },
    enabled: !!userAddress && !!publicClient && authenticated,
    staleTime: 10 * 1000,
  });
}
