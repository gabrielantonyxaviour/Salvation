import { BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { MarketCreated } from "../generated/MarketFactory/MarketFactory";
import { LMSRMarket as LMSRMarketTemplate } from "../generated/templates";
import { Market, Project } from "../generated/schema";

export function handleMarketCreated(event: MarketCreated): void {
  let market = new Market(event.params.market.toHexString());

  let projectId = event.params.projectId.toHexString();
  market.project = projectId;
  market.question = event.params.question;
  market.yesPrice = BigDecimal.fromString("0.5");
  market.noPrice = BigDecimal.fromString("0.5");
  market.yesPool = BigInt.fromI32(0);
  market.noPool = BigInt.fromI32(0);
  market.totalVolume = BigInt.fromI32(0);
  market.resolved = false;
  market.createdAt = event.block.timestamp;

  market.save();

  // Update project reference
  let project = Project.load(projectId);
  if (project) {
    project.market = market.id;
    project.updatedAt = event.block.timestamp;
    project.save();
  }

  // Create template to track market events
  LMSRMarketTemplate.create(event.params.market);
}
