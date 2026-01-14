/**
 * IPFS Utility
 * Upload and fetch files from IPFS via Pinata
 */

import config from '../config.js';

export interface IPFSUploadResult {
  cid: string;
  gatewayUrl: string;
  size: number;
}

export interface ProjectMetadata {
  name: string;
  description: string;
  category: string;
  location: {
    country: string;
    region: string;
    coordinates: [number, number];
  };
  imageUrl: string;
  revenueModel: string;
  projectedAPY: number;
  milestones: {
    description: string;
    targetDate: number;
  }[];
}

export interface VerificationMetadata {
  projectId: string;
  milestoneIndex: number;
  timestamp: number;
  verified: boolean;
  confidence: number;
  dataSources: string[];
  reasoning: string;
  newsArticles?: {
    title: string;
    url: string;
    source: string;
  }[];
  locationData?: {
    verified: boolean;
    displayName: string;
    matchScore: number;
  };
  evidenceAnalysis?: {
    analyzed: boolean;
    matchesMilestone: boolean;
    observations: string[];
  };
}

export class IPFSService {
  private pinataJwt: string;
  private gateway: string;

  constructor() {
    this.pinataJwt = config.pinataJwt;
    this.gateway = config.pinataGateway;
  }

  /**
   * Upload JSON metadata to IPFS
   */
  async uploadJSON(data: object, name: string): Promise<IPFSUploadResult> {
    console.log(`Uploading JSON to IPFS: ${name}`);

    const jsonString = JSON.stringify(data, null, 2);

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.pinataJwt}`,
      },
      body: JSON.stringify({
        pinataContent: data,
        pinataMetadata: {
          name,
          keyvalues: {
            uploadedAt: new Date().toISOString(),
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pinata upload failed: ${response.status} - ${error}`);
    }

    const result = await response.json() as { IpfsHash: string };

    return {
      cid: result.IpfsHash,
      gatewayUrl: this.getIPFSUrl(result.IpfsHash),
      size: jsonString.length,
    };
  }

  /**
   * Upload verification evidence to IPFS
   */
  async uploadVerificationEvidence(
    metadata: VerificationMetadata
  ): Promise<IPFSUploadResult> {
    const name = `verification-${metadata.projectId}-milestone-${metadata.milestoneIndex}-${Date.now()}`;
    return this.uploadJSON(metadata, name);
  }

  /**
   * Fetch JSON from IPFS
   */
  async fetchJSON<T = unknown>(cid: string): Promise<T> {
    console.log(`Fetching from IPFS: ${cid}`);

    const url = this.getIPFSUrl(cid);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`IPFS fetch failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Fetch project metadata from IPFS
   */
  async fetchProjectMetadata(metadataURI: string): Promise<ProjectMetadata> {
    // Handle both full URLs and just CIDs
    const cid = this.extractCID(metadataURI);
    return this.fetchJSON<ProjectMetadata>(cid);
  }

  /**
   * Get gateway URL for a CID
   */
  getIPFSUrl(cid: string): string {
    // Gateway is already a full URL like https://gateway.pinata.cloud/ipfs/
    const gateway = this.gateway.endsWith('/') ? this.gateway : `${this.gateway}/`;
    return `${gateway}${cid}`;
  }

  /**
   * Extract CID from various URI formats
   */
  private extractCID(uri: string): string {
    // Handle ipfs:// protocol
    if (uri.startsWith('ipfs://')) {
      return uri.replace('ipfs://', '');
    }

    // Handle gateway URLs
    const gatewayMatch = uri.match(/\/ipfs\/([a-zA-Z0-9]+)/);
    if (gatewayMatch) {
      return gatewayMatch[1];
    }

    // Assume it's already a CID
    return uri;
  }

  /**
   * Check if IPFS configuration is valid
   */
  isConfigured(): boolean {
    return Boolean(this.pinataJwt);
  }
}

export default IPFSService;
