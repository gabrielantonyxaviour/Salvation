import { BigInt } from "@graphprotocol/graph-ts";
import {
  BondCreated,
  BondsPurchased,
} from "../generated/BondFactory/BondFactory";
import { BondToken as BondTokenContract } from "../generated/BondFactory/BondToken";
import { BondToken as BondTokenTemplate } from "../generated/templates";
import { BondToken, BondHolder, Project } from "../generated/schema";

export function handleBondCreated(event: BondCreated): void {
  let bondTokenAddress = event.params.bondToken;
  let bondToken = new BondToken(bondTokenAddress.toHexString());

  // Try to get additional info from the BondToken contract
  let contract = BondTokenContract.bind(bondTokenAddress);
  let symbolResult = contract.try_symbol();

  let projectId = event.params.projectId.toHexString();
  bondToken.project = projectId;
  bondToken.symbol = symbolResult.reverted ? "BOND" : symbolResult.value;
  bondToken.totalSupply = BigInt.fromI32(0);
  bondToken.createdAt = event.block.timestamp;

  bondToken.save();

  // Update project reference
  let project = Project.load(projectId);
  if (project) {
    project.bondToken = bondToken.id;
    project.updatedAt = event.block.timestamp;
    project.save();
  }

  // Create template to track bond token events
  BondTokenTemplate.create(bondTokenAddress);
}

export function handleBondsPurchased(event: BondsPurchased): void {
  let projectId = event.params.projectId.toHexString();
  let project = Project.load(projectId);
  if (!project) return;

  let bondTokenId = project.bondToken;
  if (!bondTokenId) return;

  let bondToken = BondToken.load(bondTokenId as string);
  if (!bondToken) return;

  // Update total supply
  bondToken.totalSupply = bondToken.totalSupply.plus(event.params.bondAmount);
  bondToken.save();

  // Update project funding
  project.fundingRaised = project.fundingRaised.plus(event.params.usdcAmount);
  project.updatedAt = event.block.timestamp;
  project.save();

  // Update or create bond holder
  let holderId = bondToken.id + "-" + event.params.buyer.toHexString();
  let holder = BondHolder.load(holderId);
  if (!holder) {
    holder = new BondHolder(holderId);
    holder.bondToken = bondToken.id;
    holder.holder = event.params.buyer;
    holder.balance = BigInt.fromI32(0);
    holder.project = projectId;
  }
  holder.balance = holder.balance.plus(event.params.bondAmount);
  holder.lastActivity = event.block.timestamp;
  holder.save();
}
