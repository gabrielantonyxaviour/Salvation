import { BigInt } from "@graphprotocol/graph-ts";
import {
  MilestonesSetup,
  MilestoneVerified,
  ProjectMarkedFailed,
  OracleAggregator,
} from "../generated/OracleAggregator/OracleAggregator";
import { Milestone, Project } from "../generated/schema";

export function handleMilestonesSetup(event: MilestonesSetup): void {
  // When milestones are set up, we need to fetch them from the contract
  // and create Milestone entities
  let contract = OracleAggregator.bind(event.address);
  let milestonesResult = contract.try_getMilestones(event.params.projectId);

  if (milestonesResult.reverted) {
    return;
  }

  let milestones = milestonesResult.value;
  let projectId = event.params.projectId.toHexString();

  for (let i = 0; i < milestones.length; i++) {
    let milestoneData = milestones[i];
    let milestoneId = projectId + "-" + i.toString();
    let milestone = new Milestone(milestoneId);

    milestone.project = projectId;
    milestone.index = BigInt.fromI32(i);
    milestone.description = milestoneData.description;
    milestone.targetDate = milestoneData.targetDate;
    milestone.completed = milestoneData.completed;
    milestone.createdAt = event.block.timestamp;

    if (!milestoneData.completedAt.isZero()) {
      milestone.completedAt = milestoneData.completedAt;
    }

    milestone.save();
  }
}

export function handleMilestoneVerified(event: MilestoneVerified): void {
  let projectId = event.params.projectId.toHexString();
  let milestoneId = projectId + "-" + event.params.milestoneIndex.toString();
  let milestone = Milestone.load(milestoneId);

  if (!milestone) {
    // Create milestone if it doesn't exist
    milestone = new Milestone(milestoneId);
    milestone.project = projectId;
    milestone.index = event.params.milestoneIndex;
    milestone.description = "";
    milestone.targetDate = BigInt.fromI32(0);
    milestone.completed = false;
    milestone.createdAt = event.block.timestamp;
  }

  if (event.params.verified) {
    milestone.completed = true;
    milestone.completedAt = event.block.timestamp;
  }
  milestone.evidenceURI = event.params.evidenceURI;

  milestone.save();
}

export function handleProjectMarkedFailed(event: ProjectMarkedFailed): void {
  let project = Project.load(event.params.projectId.toHexString());
  if (!project) return;

  project.status = "failed";
  project.updatedAt = event.block.timestamp;
  project.save();
}
