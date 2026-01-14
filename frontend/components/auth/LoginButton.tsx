'use client';

import { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, ChevronDown, Copy, ExternalLink, Droplets } from 'lucide-react';
import { toast } from 'sonner';
import { formatUnits, createPublicClient, http } from 'viem';
import { mantleSepoliaTestnet } from 'viem/chains';
import { MockUSDCABI } from '@/lib/contracts/abis';
import { getContracts, MANTLE_SEPOLIA_CHAIN_ID } from '@/lib/contracts/deployments';

export function LoginButton() {
  const { login, logout, authenticated, user, ready } = usePrivy();
  const { wallets } = useWallets();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<bigint>(BigInt(0));
  const [mntBalance, setMntBalance] = useState<bigint>(BigInt(0));
  const [isLoadingBalances, setIsLoadingBalances] = useState(true);

  // Get the embedded wallet
  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
  const walletAddress = embeddedWallet?.address as `0x${string}` | undefined;
  const contracts = getContracts(MANTLE_SEPOLIA_CHAIN_ID);

  // Fetch balances using viem directly (avoids SSR issues with wagmi hooks)
  useEffect(() => {
    async function fetchBalances() {
      if (!walletAddress) {
        setIsLoadingBalances(false);
        return;
      }

      try {
        const publicClient = createPublicClient({
          chain: mantleSepoliaTestnet,
          transport: http(),
        });

        // Fetch MNT (native) balance
        const nativeBalance = await publicClient.getBalance({
          address: walletAddress,
        });
        setMntBalance(nativeBalance);

        // Fetch USDC balance
        if (contracts?.usdc && contracts.usdc !== '0x0000000000000000000000000000000000000000') {
          const usdcBal = await publicClient.readContract({
            address: contracts.usdc,
            abi: MockUSDCABI.abi,
            functionName: 'balanceOf',
            args: [walletAddress],
          }) as bigint;
          setUsdcBalance(usdcBal);
        }
      } catch (error) {
        console.error('Failed to fetch balances:', error);
      } finally {
        setIsLoadingBalances(false);
      }
    }

    if (authenticated && walletAddress) {
      fetchBalances();
      // Refresh balances every 10 seconds
      const interval = setInterval(fetchBalances, 10000);
      return () => clearInterval(interval);
    } else {
      setIsLoadingBalances(false);
    }
  }, [authenticated, walletAddress, contracts?.usdc]);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatUsdcDisplay = (balance: bigint) => {
    const num = Number(formatUnits(balance, 6));
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toFixed(2);
  };

  const formatMntDisplay = (balance: bigint) => {
    const num = Number(formatUnits(balance, 18));
    if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return num.toFixed(4);
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast.success('Address copied to clipboard');
    }
  };

  const openExplorer = () => {
    if (walletAddress) {
      window.open(`https://sepolia.mantlescan.xyz/address/${walletAddress}`, '_blank');
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Show loading state while Privy is initializing
  if (!ready) {
    return (
      <Button variant="outline" disabled className="min-w-[100px]">
        Loading...
      </Button>
    );
  }

  // Not authenticated - show connect wallet button
  if (!authenticated) {
    return (
      <Button
        onClick={login}
        size="lg"
        className="px-8"
      >
        Connect Wallet
      </Button>
    );
  }

  // Authenticated - show user dropdown
  const displayName = user?.email?.address
    ? user.email.address.split('@')[0]
    : walletAddress
    ? truncateAddress(walletAddress)
    : 'User';

  return (
    <div className="flex items-center gap-2">
      {/* USDC Balance Display - Outside dropdown */}
      <div className="hidden sm:flex items-center px-3 py-2 bg-neutral-900/50 border border-neutral-700 rounded-md">
        <span className="text-white font-medium text-sm">
          {isLoadingBalances ? '...' : `$${formatUsdcDisplay(usdcBalance)}`}
        </span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center gap-2 border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800/50 text-white"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{displayName}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-64 bg-neutral-900 border-neutral-800 text-white"
        >
          {user?.email?.address && (
            <>
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user.email.address}</p>
              </div>
              <DropdownMenuSeparator className="bg-neutral-800" />
            </>
          )}

          {/* USD Balance - Mobile only */}
          <div className="sm:hidden px-2 py-1.5">
            <p className="text-xs text-neutral-400">Balance</p>
            <p className="text-sm font-medium text-white">
              {isLoadingBalances ? '...' : `$${formatUsdcDisplay(usdcBalance)}`}
            </p>
          </div>
          <DropdownMenuSeparator className="sm:hidden bg-neutral-800" />

          {walletAddress && (
            <>
              <div className="px-2 py-1.5">
                <p className="text-xs text-neutral-400">Wallet</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-mono">{truncateAddress(walletAddress)}</p>
                  <span className="text-xs text-neutral-400">
                    {isLoadingBalances ? '...' : `${formatMntDisplay(mntBalance)} MNT`}
                  </span>
                </div>
              </div>
              <DropdownMenuItem
                onClick={copyAddress}
                className="cursor-pointer hover:bg-neutral-800"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Address
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={openExplorer}
                className="cursor-pointer hover:bg-neutral-800"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Explorer
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/faucet')}
                className="cursor-pointer hover:bg-neutral-800"
              >
                <Droplets className="h-4 w-4 mr-2" />
                Faucet
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-neutral-800" />
            </>
          )}
          <DropdownMenuItem
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="cursor-pointer hover:bg-neutral-800 text-red-400 focus:text-red-400"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
