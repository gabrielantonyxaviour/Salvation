import { BigInt, dataSource } from "@graphprotocol/graph-ts";
import {
  Transfer,
  BondsMinted,
} from "../generated/templates/BondToken/BondToken";
import { BondToken, BondHolder } from "../generated/schema";

export function handleBondsMinted(event: BondsMinted): void {
  let bondTokenAddress = dataSource.address();
  let bondToken = BondToken.load(bondTokenAddress.toHexString());
  if (!bondToken) return;

  // Update total supply
  bondToken.totalSupply = bondToken.totalSupply.plus(event.params.amount);
  bondToken.save();

  // Update or create bond holder
  let holderId = bondToken.id + "-" + event.params.to.toHexString();
  let holder = BondHolder.load(holderId);
  if (!holder) {
    holder = new BondHolder(holderId);
    holder.bondToken = bondToken.id;
    holder.holder = event.params.to;
    holder.balance = BigInt.fromI32(0);
    holder.project = bondToken.project;
  }
  holder.balance = holder.balance.plus(event.params.amount);
  holder.lastActivity = event.block.timestamp;
  holder.save();
}

export function handleTransfer(event: Transfer): void {
  // Skip mint/burn events (handled by BondsMinted)
  if (
    event.params.from.toHexString() ==
      "0x0000000000000000000000000000000000000000" ||
    event.params.to.toHexString() ==
      "0x0000000000000000000000000000000000000000"
  ) {
    return;
  }

  let bondTokenAddress = dataSource.address();
  let bondToken = BondToken.load(bondTokenAddress.toHexString());
  if (!bondToken) return;

  // Update sender balance
  let fromId = bondToken.id + "-" + event.params.from.toHexString();
  let fromHolder = BondHolder.load(fromId);
  if (fromHolder) {
    fromHolder.balance = fromHolder.balance.minus(event.params.value);
    fromHolder.lastActivity = event.block.timestamp;
    fromHolder.save();
  }

  // Update or create receiver
  let toId = bondToken.id + "-" + event.params.to.toHexString();
  let toHolder = BondHolder.load(toId);
  if (!toHolder) {
    toHolder = new BondHolder(toId);
    toHolder.bondToken = bondToken.id;
    toHolder.holder = event.params.to;
    toHolder.balance = BigInt.fromI32(0);
    toHolder.project = bondToken.project;
  }
  toHolder.balance = toHolder.balance.plus(event.params.value);
  toHolder.lastActivity = event.block.timestamp;
  toHolder.save();
}
