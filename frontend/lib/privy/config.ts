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

// Privy configuration - email only, embedded wallets
export const privyConfig: PrivyClientConfig = {
  loginMethods: ['email'],
  appearance: {
    theme: 'dark',
    accentColor: '#F97316',
    logo: '/images/logo.png',
    showWalletLoginFirst: false,
  },
  embeddedWallets: {
    ethereum: {
      createOnLogin: 'all-users',
    },
  },
  defaultChain: mantleSepolia,
  supportedChains: [mantleSepolia],
};
