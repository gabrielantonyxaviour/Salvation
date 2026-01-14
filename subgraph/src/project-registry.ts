import { BigInt, BigDecimal, ipfs, json } from "@graphprotocol/graph-ts";
import {
  ProjectRegistered,
  ProjectStatusUpdated,
  ProjectFunded,
} from "../generated/ProjectRegistry/ProjectRegistry";
import { Project, Location } from "../generated/schema";

export function handleProjectRegistered(event: ProjectRegistered): void {
  let project = new Project(event.params.projectId.toHexString());

  project.metadataURI = event.params.metadataURI;
  project.sponsor = event.params.sponsor;
  project.fundingGoal = event.params.fundingGoal;
  project.fundingRaised = BigInt.fromI32(0);
  project.bondPrice = event.params.bondPrice;
  project.status = "pending";
  project.createdAt = event.block.timestamp;
  project.updatedAt = event.block.timestamp;

  // Fetch and parse IPFS metadata
  let metadataURI = event.params.metadataURI;
  if (metadataURI.startsWith("ipfs://")) {
    let hash = metadataURI.replace("ipfs://", "");
    let data = ipfs.cat(hash);

    if (data) {
      let jsonResult = json.try_fromBytes(data);
      if (jsonResult.isOk) {
        let obj = jsonResult.value.toObject();

        // Parse name
        let nameValue = obj.get("name");
        if (nameValue) {
          project.name = nameValue.toString();
        }

        // Parse description
        let descValue = obj.get("description");
        if (descValue) {
          project.description = descValue.toString();
        }

        // Parse category
        let catValue = obj.get("category");
        if (catValue) {
          project.category = catValue.toString();
        }

        // Parse imageUrl
        let imageValue = obj.get("imageUrl");
        if (imageValue) {
          project.imageUrl = imageValue.toString();
        }

        // Parse revenueModel
        let revenueValue = obj.get("revenueModel");
        if (revenueValue) {
          project.revenueModel = revenueValue.toString();
        }

        // Parse projectedAPY
        let apyValue = obj.get("projectedAPY");
        if (apyValue) {
          project.projectedAPY = apyValue.toBigInt();
        }

        // Parse location
        let locationValue = obj.get("location");
        if (locationValue) {
          let locationObj = locationValue.toObject();
          let locationId = project.id + "-location";
          let location = new Location(locationId);

          let countryVal = locationObj.get("country");
          if (countryVal) location.country = countryVal.toString();

          let regionVal = locationObj.get("region");
          if (regionVal) location.region = regionVal.toString();

          let coordsVal = locationObj.get("coordinates");
          if (coordsVal) {
            let coordsArr = coordsVal.toArray();
            if (coordsArr.length >= 2) {
              location.latitude = BigDecimal.fromString(
                coordsArr[0].toF64().toString()
              );
              location.longitude = BigDecimal.fromString(
                coordsArr[1].toF64().toString()
              );
            }
          }

          location.save();
          project.location = locationId;
        }
      }
    }
  }

  project.save();
}

export function handleProjectStatusUpdated(event: ProjectStatusUpdated): void {
  let project = Project.load(event.params.projectId.toHexString());
  if (!project) return;

  // Map enum values: 0=pending, 1=funding, 2=active, 3=completed, 4=failed
  let statusMap = ["pending", "funding", "active", "completed", "failed"];
  let statusIndex = event.params.status;
  if (statusIndex >= 0 && statusIndex < statusMap.length) {
    project.status = statusMap[statusIndex];
  }

  project.updatedAt = event.block.timestamp;
  project.save();
}

export function handleProjectFunded(event: ProjectFunded): void {
  let project = Project.load(event.params.projectId.toHexString());
  if (!project) return;

  project.fundingRaised = event.params.totalRaised;
  project.updatedAt = event.block.timestamp;
  project.save();
}
