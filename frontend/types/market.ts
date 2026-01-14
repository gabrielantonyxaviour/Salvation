// Market types for Salvation prediction markets

export interface Market {
  id: string;
  address: `0x${string}`;
  projectId: string;
  projectName: string;
  question: string;
  yesPrice: number;
  noPrice: number;
  yesShares: number;
  noShares: number;
  liquidity: number; // b parameter
  resolutionTime: number;
  resolved: boolean;
  outcome?: boolean;
  totalVolume: number;
  yesTokenAddress: `0x${string}`;
  noTokenAddress: `0x${string}`;
  collateralAddress: `0x${string}`;
}

export interface MarketPosition {
  marketId: string;
  marketAddress: `0x${string}`;
  projectName: string;
  question: string;
  yesBalance: number;
  noBalance: number;
  yesValue: number;
  noValue: number;
  resolved: boolean;
  outcome?: boolean;
  won?: boolean;
  claimable: number;
}

export type MarketStatus = 'active' | 'resolved' | 'all';

export interface MarketFilters {
  status: MarketStatus;
  search?: string;
}

// Trade types
export type TradeSide = 'yes' | 'no';
export type TradeAction = 'buy' | 'sell';

export interface TradeParams {
  market: `0x${string}`;
  side: TradeSide;
  action: TradeAction;
  shares: number;
}

// LMSR price calculation helpers
export interface LMSRQuote {
  cost: number;
  avgPrice: number;
  priceImpact: number;
}
