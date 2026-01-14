// Portfolio types for Salvation frontend

import type { MarketPosition } from './market';

export interface BondHolding {
  projectId: string;
  projectName: string;
  bondTokenAddress: `0x${string}`;
  balance: number;
  value: number;
  apy: number;
  claimableYield: number;
  imageUrl: string;
  category: string;
}

export interface PortfolioSummary {
  totalBondValue: number;
  totalClaimableYield: number;
  averageAPY: number;
  totalPositionValue: number;
  holdings: BondHolding[];
  positions: MarketPosition[];
}

export interface YieldInfo {
  projectId: string;
  totalRevenue: number;
  distributed: number;
  apy: number;
  claimable: number;
}
