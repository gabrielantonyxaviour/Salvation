'use client';

import { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { usePublicClient, useWalletClient } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Coins, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { formatUnits } from 'viem';
import { MockUSDCABI } from '@/lib/contracts/abis';
import { getContracts, MANTLE_SEPOLIA_CHAIN_ID } from '@/lib/contracts/deployments';
import { getTransactionErrorMessage } from '@/lib/utils/transaction';

export default function FaucetPageContent() {
  const { authenticated, ready, login } = usePrivy();
  const { wallets } = useWallets();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [usdcBalance, setUsdcBalance] = useState<bigint>(BigInt(0));
  const [mntBalance, setMntBalance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
  const walletAddress = embeddedWallet?.address as `0x${string}` | undefined;
  const contracts = getContracts(MANTLE_SEPOLIA_CHAIN_ID);

  // Fetch balances
  useEffect(() => {
    async function fetchBalances() {
      if (!walletAddress || !publicClient) {
        setIsFetching(false);
        return;
      }

      try {
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
        setIsFetching(false);
      }
    }

    if (authenticated && walletAddress) {
      fetchBalances();
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
    setLastTxHash(null);

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

      setLastTxHash(hash);
      toast.success('Received 10,000 USDC!', { id: 'faucet' });

      // Refresh balances
      if (walletAddress && publicClient) {
        const newBal = await publicClient.readContract({
          address: contracts.usdc,
          abi: MockUSDCABI.abi,
          functionName: 'balanceOf',
          args: [walletAddress],
        }) as bigint;
        setUsdcBalance(newBal);
      }
    } catch (error: any) {
      console.error('Faucet error:', error);
      toast.error(getTransactionErrorMessage(error), { id: 'faucet' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatBalance = (balance: bigint, decimals: number) => {
    return Number(formatUnits(balance, decimals)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: decimals === 6 ? 2 : 4,
    });
  };

  // Not ready yet
  if (!ready) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-3 text-neutral-400">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Test USDC Faucet</h1>
          <p className="text-neutral-400">
            Get free test USDC to explore Salvation on Mantle Sepolia
          </p>
        </div>

        {/* Not authenticated */}
        {!authenticated ? (
          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-orange-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Connect Wallet</h3>
              <p className="text-neutral-400 mb-6">
                Please connect your wallet to use the faucet
              </p>
              <Button onClick={login} size="lg" className="px-8">
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Current Balances */}
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Coins className="h-5 w-5 text-orange-400" />
                  Your Balances
                </CardTitle>
                <CardDescription>Current token balances in your wallet</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-neutral-800/50 rounded-lg">
                    <p className="text-sm text-neutral-400 mb-1">Test USDC</p>
                    <p className="text-2xl font-bold text-white">
                      {isFetching ? '...' : `$${formatBalance(usdcBalance, 6)}`}
                    </p>
                  </div>
                  <div className="p-4 bg-neutral-800/50 rounded-lg">
                    <p className="text-sm text-neutral-400 mb-1">MNT (Gas)</p>
                    <p className="text-2xl font-bold text-white">
                      {isFetching ? '...' : formatBalance(mntBalance, 18)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Faucet Card */}
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white">Request Test USDC</CardTitle>
                <CardDescription>
                  Mint 10,000 test USDC tokens to your wallet. Use these to test investing in projects, trading on prediction markets, and exploring the platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-white font-medium">Test Tokens Only</p>
                      <p className="text-xs text-neutral-400 mt-1">
                        These tokens have no real value and can only be used on Mantle Sepolia testnet.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleFaucet}
                  disabled={isLoading}
                  size="lg"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white h-14 text-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Requesting USDC...
                    </>
                  ) : (
                    'Get 10,000 Test USDC'
                  )}
                </Button>

                {/* Success message */}
                {lastTxHash && (
                  <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium">USDC Received!</p>
                        <a
                          href={`https://sepolia.mantlescan.xyz/tx/${lastTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 mt-1"
                        >
                          View transaction
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* MNT Faucet Info */}
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white text-lg">Need MNT for Gas?</CardTitle>
                <CardDescription>
                  MNT is required for transaction fees on Mantle Sepolia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-400 mb-4">
                  If you need MNT tokens for gas fees, you can get them from the official Mantle Sepolia faucet.
                </p>
                <a
                  href="https://faucet.sepolia.mantle.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="border-neutral-700 hover:bg-neutral-800">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Mantle Sepolia Faucet
                  </Button>
                </a>
              </CardContent>
            </Card>

          </div>
        )}
      </div>
    </div>
  );
}
