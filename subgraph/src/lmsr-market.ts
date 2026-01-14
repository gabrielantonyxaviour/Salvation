import { BigInt, BigDecimal, dataSource } from "@graphprotocol/graph-ts";
import {
  SharesPurchased,
  SharesSold,
  MarketResolved,
} from "../generated/templates/LMSRMarket/LMSRMarket";
import { Market, Trade } from "../generated/schema";

// Helper to update prices using LMSR-like calculation
function updateMarketPrices(market: Market): void {
  let totalPool = market.yesPool.plus(market.noPool);

  if (totalPool.gt(BigInt.fromI32(0))) {
    let yesRatio = market.yesPool.toBigDecimal().div(totalPool.toBigDecimal());
    let noRatio = market.noPool.toBigDecimal().div(totalPool.toBigDecimal());

    // Simplified price calculation
    market.yesPrice = yesRatio;
    market.noPrice = noRatio;
  }
}

export function handleSharesPurchased(event: SharesPurchased): void {
  let marketAddress = dataSource.address();
  let market = Market.load(marketAddress.toHexString());
  if (!market) return;

  // Create trade record
  let tradeId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let trade = new Trade(tradeId);
  trade.market = market.id;
  trade.trader = event.params.buyer;
  trade.isYes = event.params.isYes;
  trade.isBuy = true;
  trade.amount = event.params.shares;
  trade.cost = event.params.cost;
  trade.timestamp = event.block.timestamp;
  trade.save();

  // Update market pools
  if (event.params.isYes) {
    market.yesPool = market.yesPool.plus(event.params.shares);
  } else {
    market.noPool = market.noPool.plus(event.params.shares);
  }

  market.totalVolume = market.totalVolume.plus(event.params.cost);

  // Recalculate prices based on LMSR formula
  updateMarketPrices(market);
  market.save();
}

export function handleSharesSold(event: SharesSold): void {
  let marketAddress = dataSource.address();
  let market = Market.load(marketAddress.toHexString());
  if (!market) return;

  // Create trade record
  let tradeId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let trade = new Trade(tradeId);
  trade.market = market.id;
  trade.trader = event.params.seller;
  trade.isYes = event.params.isYes;
  trade.isBuy = false;
  trade.amount = event.params.shares;
  trade.cost = event.params.payout;
  trade.timestamp = event.block.timestamp;
  trade.save();

  // Update market pools
  if (event.params.isYes) {
    market.yesPool = market.yesPool.minus(event.params.shares);
  } else {
    market.noPool = market.noPool.minus(event.params.shares);
  }

  market.totalVolume = market.totalVolume.plus(event.params.payout);

  updateMarketPrices(market);
  market.save();
}

export function handleMarketResolved(event: MarketResolved): void {
  let marketAddress = dataSource.address();
  let market = Market.load(marketAddress.toHexString());
  if (!market) return;

  market.resolved = true;
  market.outcome = event.params.outcome;
  market.resolvedAt = event.params.timestamp;
  market.save();
}
