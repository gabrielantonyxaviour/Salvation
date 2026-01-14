import { BigInt } from "@graphprotocol/graph-ts";
import {
  RevenueDeposited,
  YieldClaimed,
} from "../generated/YieldVault/YieldVault";
import { YieldVault, YieldClaim } from "../generated/schema";

export function handleRevenueDeposited(event: RevenueDeposited): void {
  let vaultId = event.params.projectId.toHexString() + "-vault";
  let vault = YieldVault.load(vaultId);

  if (!vault) {
    vault = new YieldVault(vaultId);
    vault.project = event.params.projectId.toHexString();
    vault.totalYield = BigInt.fromI32(0);
    vault.claimedYield = BigInt.fromI32(0);
  }

  vault.totalYield = vault.totalYield.plus(event.params.amount);
  vault.lastDeposit = event.block.timestamp;
  vault.save();
}

export function handleYieldClaimed(event: YieldClaimed): void {
  let vaultId = event.params.projectId.toHexString() + "-vault";
  let vault = YieldVault.load(vaultId);
  if (!vault) return;

  vault.claimedYield = vault.claimedYield.plus(event.params.amount);
  vault.save();

  // Create claim record
  let claimId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let claim = new YieldClaim(claimId);
  claim.vault = vaultId;
  claim.claimer = event.params.holder;
  claim.amount = event.params.amount;
  claim.timestamp = event.block.timestamp;
  claim.save();
}
