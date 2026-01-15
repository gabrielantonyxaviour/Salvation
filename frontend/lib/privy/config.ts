import { defineChain } from 'viem';
import type { PrivyClientConfig } from '@privy-io/react-auth';

// Mantle Sepolia chain configuration
export const mantleSepolia = defineChain({
  id: 5003,
  name: 'Mantle Sepolia',
  network: 'mantle-sepolia',
  nativeCurrency: {
    name: 'MNT',
    symbol: 'MNT',
    decimals: 18
  },
  rpcUrls: {
    default: { http: ['https://rpc.sepolia.mantle.xyz'] },
  },
  blockExplorers: {
    default: {
      name: 'Mantle Sepolia Explorer',
      url: 'https://sepolia.mantlescan.xyz'
    },
  },
  testnet: true,
});

// Privy configuration - email and web3 wallets
export const privyConfig: PrivyClientConfig = {
  loginMethods: ['email', 'wallet'],
  appearance: {
    theme: 'dark',
    accentColor: '#f97316',
    logo: '/images/logo.png',
    showWalletLoginFirst: false,
    landingHeader: 'Connect to Salvation',
    walletChainType: 'ethereum-only',
    walletList: ['metamask', 'coinbase_wallet', 'rainbow', 'wallet_connect'],
  },
  embeddedWallets: {
    ethereum: {
      createOnLogin: 'users-without-wallets',
    },
  },
  defaultChain: mantleSepolia,
  supportedChains: [mantleSepolia],
};
