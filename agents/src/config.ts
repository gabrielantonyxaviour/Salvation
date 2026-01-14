/**
 * Configuration for Salvation Oracle Agent
 */

import 'dotenv/config';

export const config = {
  // Server
  port: parseInt(process.env.A2A_SERVER_PORT || '5002'),

  // Blockchain
  rpcUrl: process.env.RPC_URL || 'https://rpc.sepolia.mantle.xyz',
  chainId: 5003,
  privateKey: process.env.PRIVATE_KEY || '',

  // Contract Addresses (Mantle Sepolia)
  contracts: {
    usdc: process.env.USDC_ADDRESS || '0x1B3b102adc9405EBB9A6a9Ff85562D5c8E5eB0D4',
    projectRegistry: process.env.PROJECT_REGISTRY_ADDRESS || '0x7b26647372E10B7e363A8A857FF88C0C0b63913b',
    bondFactory: process.env.BOND_FACTORY_ADDRESS || '0x9ED03b9a9Fb743ac36EFb35B72a2db31DE525821',
    yieldVault: process.env.YIELD_VAULT_ADDRESS || '0xe05dC9467de459adFc5c31Ce4746579d29B65ba2',
    marketFactory: process.env.MARKET_FACTORY_ADDRESS || '0xCEF696B36e24945f45166548B1632c7585e3F0DB',
    oracleAggregator: process.env.ORACLE_AGGREGATOR_ADDRESS || '0x11191A01670643f2BE3BD8965a16F59556258c2d',
  },

  // Claude Service (local claude-code wrapper)
  claudeServiceUrl: process.env.CLAUDE_SERVICE_URL || 'http://localhost:3000',
  claudeServiceApiKey: process.env.CLAUDE_SERVICE_API_KEY || '',

  // News API
  newsApiKey: process.env.NEWS_API_KEY || '',

  // IPFS (Pinata)
  pinataJwt: process.env.PINATA_JWT || '',
  pinataGateway: process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/',

  // Verification thresholds
  verification: {
    minConfidence: 70, // Minimum confidence to auto-verify
    newsRelevanceThreshold: 0.5,
    locationMatchThreshold: 0.8,
  },
};

// Validate required config
export function validateConfig(): boolean {
  const errors: string[] = [];

  if (!config.privateKey) {
    errors.push('PRIVATE_KEY is required');
  }

  if (!config.claudeServiceApiKey) {
    errors.push('CLAUDE_SERVICE_API_KEY is required');
  }

  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach(e => console.error(`  - ${e}`));
    return false;
  }

  return true;
}

export default config;
