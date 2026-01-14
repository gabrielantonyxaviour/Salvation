/**
 * LMSR (Logarithmic Market Scoring Rule) utility functions
 * These calculations mirror the on-chain LMSR.sol library
 * All values use WAD scale (1e18 = 1.0)
 */

const WAD = 1e18;
const LN2 = 0.6931471805599453;

/**
 * Calculate the LMSR cost function
 * C = b * ln(e^(yes/b) + e^(no/b))
 */
export function cost(yesShares: number, noShares: number, b: number): number {
  if (b <= 0) throw new Error('LMSR: b must be positive');

  const yesOverB = yesShares / b;
  const noOverB = noShares / b;

  // Use log-sum-exp trick to avoid overflow
  const maxVal = Math.max(yesOverB, noOverB);
  const minVal = Math.min(yesOverB, noOverB);
  const diff = minVal - maxVal;

  const lnSum = maxVal + Math.log(1 + Math.exp(diff));
  return b * lnSum;
}

/**
 * Calculate current YES token price (0 to 1)
 * Uses softmax: p_yes = 1 / (1 + e^((no-yes)/b))
 */
export function calculatePrice(yesShares: number, noShares: number, b: number): number {
  if (b <= 0) throw new Error('LMSR: b must be positive');

  const diff = (noShares - yesShares) / b;

  // Handle extreme values
  if (diff > 130) return 0;
  if (diff < -41) return 1;

  return 1 / (1 + Math.exp(diff));
}

/**
 * Calculate cost to buy shares
 * Cost = newCost - currentCost
 */
export function calculateCost(
  isYes: boolean,
  shares: number,
  yesShares: number,
  noShares: number,
  b: number
): number {
  const currentCost = cost(yesShares, noShares, b);

  const newYes = isYes ? yesShares + shares : yesShares;
  const newNo = isYes ? noShares : noShares + shares;

  const newCost = cost(newYes, newNo, b);

  return Math.max(0, newCost - currentCost);
}

/**
 * Calculate return from selling shares
 * Return = currentCost - newCost
 */
export function calculateReturn(
  isYes: boolean,
  shares: number,
  yesShares: number,
  noShares: number,
  b: number
): number {
  const currentCost = cost(yesShares, noShares, b);

  const newYes = isYes ? yesShares - shares : yesShares;
  const newNo = isYes ? noShares : noShares - shares;

  const newCost = cost(newYes, newNo, b);

  return Math.max(0, currentCost - newCost);
}

/**
 * Calculate price impact of a trade
 * Returns the percentage change in price after the trade
 */
export function calculatePriceImpact(
  isYes: boolean,
  shares: number,
  yesShares: number,
  noShares: number,
  b: number
): number {
  const currentPrice = calculatePrice(yesShares, noShares, b);

  const newYes = isYes ? yesShares + shares : yesShares;
  const newNo = isYes ? noShares : noShares + shares;

  const newPrice = calculatePrice(newYes, newNo, b);

  // Calculate absolute price change
  const priceChange = Math.abs(newPrice - currentPrice);

  // Return as percentage
  return (priceChange / currentPrice) * 100;
}

/**
 * Calculate shares you get for a given collateral amount (approximate)
 * Uses binary search to find shares that cost approximately the target amount
 */
export function calculateSharesForCost(
  isYes: boolean,
  targetCost: number,
  yesShares: number,
  noShares: number,
  b: number,
  precision: number = 0.001
): number {
  let low = 0;
  let high = targetCost * 2; // Upper bound estimate

  while (high - low > precision) {
    const mid = (low + high) / 2;
    const cost = calculateCost(isYes, mid, yesShares, noShares, b);

    if (cost < targetCost) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return (low + high) / 2;
}

/**
 * Format price as percentage (0.78 -> "78%")
 */
export function formatPrice(price: number): string {
  return `${Math.round(price * 100)}%`;
}

/**
 * Format price as dollar value (0.78 -> "$0.78")
 */
export function formatPriceDollar(price: number): string {
  return `$${price.toFixed(2)}`;
}

/**
 * Convert from WAD (1e18) to display value
 */
export function fromWad(value: bigint): number {
  return Number(value) / WAD;
}

/**
 * Convert from display value to WAD (1e18)
 */
export function toWad(value: number): bigint {
  return BigInt(Math.floor(value * WAD));
}
