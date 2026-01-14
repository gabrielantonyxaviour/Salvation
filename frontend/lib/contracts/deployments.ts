// Contract addresses per chain
// These will be populated after deploying contracts

export const MANTLE_SEPOLIA_CHAIN_ID = 5003;

export interface ContractAddresses {
  usdc: `0x${string}`;
  projectRegistry: `0x${string}`;
  bondFactory: `0x${string}`;
  yieldVault: `0x${string}`;
  marketFactory: `0x${string}`;
  oracleAggregator: `0x${string}`;
  identityRegistry: `0x${string}`;
  complianceModule: `0x${string}`;
}

// Mantle Sepolia deployments (deployed 2026-01-15 with decimal fix)
export const mantleSepoliaContracts: ContractAddresses = {
  usdc: '0xBEFdC386aA5AecA6d9c45f6c316C43c5e01DBb44',
  projectRegistry: '0x7cC5385b2fa1cA408a2f7F938001cf0ccECA390c',
  bondFactory: '0xcfCd96d4b017Bc83Fd67B030D32d103a7F6F485D',
  yieldVault: '0xFB66a25b0B81285e8beF1E6cA35976EC49B70056',
  marketFactory: '0xa9fa08aef1c34AeB7851Ab5Ac3ed955BD071151A',
  oracleAggregator: '0xE40FEF7cd6721a6f3e1B88647a0558d392fb476F',
  // Not deployed for MVP - set to zero
  identityRegistry: '0x0000000000000000000000000000000000000000',
  complianceModule: '0x0000000000000000000000000000000000000000',
};

// Get contracts by chain ID
export function getContracts(chainId: number): ContractAddresses | null {
  switch (chainId) {
    case MANTLE_SEPOLIA_CHAIN_ID:
      return mantleSepoliaContracts;
    default:
      return null;
  }
}

// Check if core contracts are deployed (non-zero addresses)
export function areContractsDeployed(chainId: number): boolean {
  const contracts = getContracts(chainId);
  if (!contracts) return false;

  const zeroAddress = '0x0000000000000000000000000000000000000000';
  // Only check essential contracts (not identityRegistry/complianceModule)
  const essentialContracts = [
    contracts.usdc,
    contracts.projectRegistry,
    contracts.bondFactory,
    contracts.yieldVault,
    contracts.marketFactory,
    contracts.oracleAggregator,
  ];
  return essentialContracts.every(addr => addr !== zeroAddress);
}
