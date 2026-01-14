'use client';

import { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { usePublicClient, useWalletClient } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Droplets, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { MockUSDCABI } from '@/lib/contracts/abis';
import { getContracts, MANTLE_SEPOLIA_CHAIN_ID } from '@/lib/contracts/deployments';
import { formatUnits } from 'viem';
import { getTransactionErrorMessage } from '@/lib/utils/transaction';

interface FaucetProps {
  variant?: 'default' | 'compact';
  showAlways?: boolean;
}

export function Faucet({ variant = 'default', showAlways = false }: FaucetProps) {
  const { authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
  const walletAddress = embeddedWallet?.address as `0x${string}` | undefined;
  const contracts = getContracts(MANTLE_SEPOLIA_CHAIN_ID);

  // Fetch USDC balance
  useEffect(() => {
    async function fetchBalance() {
      if (!walletAddress || !publicClient || !contracts?.usdc || contracts.usdc === '0x0000000000000000000000000000000000000000') {
        setIsFetching(false);
        return;
      }

      try {
        const bal = await publicClient.readContract({
          address: contracts.usdc,
          abi: MockUSDCABI.abi,
          functionName: 'balanceOf',
          args: [walletAddress],
        }) as bigint;
        setBalance(bal);
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      } finally {
        setIsFetching(false);
      }
    }

    if (authenticated && walletAddress) {
      fetchBalance();
    } else {
      setIsFetching(false);
    }
  }, [authenticated, walletAddress, publicClient, contracts?.usdc]);

  const handleFaucet = async () => {
    if (!walletClient || !contracts?.usdc || contracts.usdc === '0x0000000000000000000000000000000000000000') {
      toast.error('Contracts not deployed yet');
      return;
    }

    setIsLoading(true);
    try {
      const hash = await walletClient.writeContract({
        address: contracts.usdc,
        abi: MockUSDCABI.abi,
        functionName: 'faucet',
        args: [],
      });

      toast.loading('Requesting USDC from faucet...', { id: 'faucet' });

      // Wait for transaction
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      toast.success('Received 10,000 USDC!', { id: 'faucet' });

      // Refresh balance
      if (walletAddress && publicClient) {
        const newBal = await publicClient.readContract({
          address: contracts.usdc,
          abi: MockUSDCABI.abi,
          functionName: 'balanceOf',
          args: [walletAddress],
        }) as bigint;
        setBalance(newBal);
      }
    } catch (error: any) {
      console.error('Faucet error:', error);
      toast.error(getTransactionErrorMessage(error), { id: 'faucet' });
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if not ready or not authenticated
  if (!ready || !authenticated) {
    return null;
  }

  // Don't render if contracts aren't deployed
  if (!contracts?.usdc || contracts.usdc === '0x0000000000000000000000000000000000000000') {
    return null;
  }

  // Don't render if balance is high enough (unless showAlways)
  const balanceNum = Number(formatUnits(balance, 6));
  if (!showAlways && balanceNum > 100 && !isFetching) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <Button
        onClick={handleFaucet}
        disabled={isLoading}
        size="sm"
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Droplets className="h-4 w-4 mr-1" />
            Get USDC
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
      <Droplets className="h-5 w-5 text-blue-400" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium">Need test USDC?</p>
        <p className="text-xs text-neutral-400">
          Balance: {isFetching ? '...' : `${balanceNum.toLocaleString()} USDC`}
        </p>
      </div>
      <Button
        onClick={handleFaucet}
        disabled={isLoading}
        size="sm"
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          'Get 10K USDC'
        )}
      </Button>
    </div>
  );
}
