/**
 * Blockchain Service
 * Handles contract interactions with Mantle Sepolia
 */

import { ethers } from 'ethers';
import config from '../config.js';

// ABIs (minimal for what we need)
const PROJECT_REGISTRY_ABI = [
  'function getProject(bytes32 projectId) view returns (tuple(bytes32 id, string metadataURI, address sponsor, uint256 fundingGoal, uint256 fundingRaised, uint256 bondPrice, uint8 status, uint256 createdAt))',
  'function getAllProjects() view returns (tuple(bytes32 id, string metadataURI, address sponsor, uint256 fundingGoal, uint256 fundingRaised, uint256 bondPrice, uint8 status, uint256 createdAt)[])',
  'function getActiveProjects() view returns (tuple(bytes32 id, string metadataURI, address sponsor, uint256 fundingGoal, uint256 fundingRaised, uint256 bondPrice, uint8 status, uint256 createdAt)[])',
];

const ORACLE_AGGREGATOR_ABI = [
  'function setupMilestones(bytes32 projectId, string[] descriptions, uint256[] targetDates)',
  'function verifyMilestone(bytes32 projectId, uint256 milestoneIndex, bool verified, string evidenceURI, string[] dataSources, uint256 confidence)',
  'function markProjectFailed(bytes32 projectId, string reason)',
  'function getMilestones(bytes32 projectId) view returns (tuple(string description, uint256 targetDate, bool completed, uint256 completedAt)[])',
  'function getVerifications(bytes32 projectId) view returns (tuple(bytes32 projectId, uint256 milestoneIndex, bool verified, string evidenceURI, string[] dataSources, uint256 confidence, uint256 timestamp)[])',
  'function getProjectProgress(bytes32 projectId) view returns (uint256 completed, uint256 total)',
  'function getMilestoneCount(bytes32 projectId) view returns (uint256)',
  'event MilestoneVerified(bytes32 indexed projectId, uint256 indexed milestoneIndex, bool verified, string evidenceURI, uint256 confidence)',
];

const MARKET_FACTORY_ABI = [
  'function getMarket(bytes32 projectId) view returns (address)',
];

const LMSR_MARKET_ABI = [
  'function getYesPrice() view returns (uint256)',
  'function getNoPrice() view returns (uint256)',
  'function resolved() view returns (bool)',
  'function outcome() view returns (bool)',
];

export enum ProjectStatus {
  Pending = 0,
  Funding = 1,
  Active = 2,
  Completed = 3,
  Failed = 4,
}

export interface Project {
  id: string;
  metadataURI: string;
  sponsor: string;
  fundingGoal: bigint;
  fundingRaised: bigint;
  bondPrice: bigint;
  status: ProjectStatus;
  createdAt: bigint;
}

export interface Milestone {
  description: string;
  targetDate: bigint;
  completed: boolean;
  completedAt: bigint;
}

export interface Verification {
  projectId: string;
  milestoneIndex: bigint;
  verified: boolean;
  evidenceURI: string;
  dataSources: string[];
  confidence: bigint;
  timestamp: bigint;
}

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private projectRegistry: ethers.Contract;
  private oracleAggregator: ethers.Contract;
  private marketFactory: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);

    this.projectRegistry = new ethers.Contract(
      config.contracts.projectRegistry,
      PROJECT_REGISTRY_ABI,
      this.wallet
    );

    this.oracleAggregator = new ethers.Contract(
      config.contracts.oracleAggregator,
      ORACLE_AGGREGATOR_ABI,
      this.wallet
    );

    this.marketFactory = new ethers.Contract(
      config.contracts.marketFactory,
      MARKET_FACTORY_ABI,
      this.provider
    );
  }

  /**
   * Get oracle wallet address
   */
  getOracleAddress(): string {
    return this.wallet.address;
  }

  /**
   * Get project by ID
   */
  async getProject(projectId: string): Promise<Project> {
    const result = await this.projectRegistry.getProject(projectId);
    return this.parseProject(result);
  }

  /**
   * Get all projects
   */
  async getAllProjects(): Promise<Project[]> {
    const results = await this.projectRegistry.getAllProjects();
    return results.map((r: any) => this.parseProject(r));
  }

  /**
   * Get active projects (Funding or Active status)
   */
  async getActiveProjects(): Promise<Project[]> {
    const results = await this.projectRegistry.getActiveProjects();
    return results.map((r: any) => this.parseProject(r));
  }

  /**
   * Get milestones for a project
   */
  async getMilestones(projectId: string): Promise<Milestone[]> {
    const results = await this.oracleAggregator.getMilestones(projectId);
    return results.map((r: any) => ({
      description: r.description,
      targetDate: r.targetDate,
      completed: r.completed,
      completedAt: r.completedAt,
    }));
  }

  /**
   * Get milestone count
   */
  async getMilestoneCount(projectId: string): Promise<number> {
    const count = await this.oracleAggregator.getMilestoneCount(projectId);
    return Number(count);
  }

  /**
   * Get verifications for a project
   */
  async getVerifications(projectId: string): Promise<Verification[]> {
    const results = await this.oracleAggregator.getVerifications(projectId);
    return results.map((r: any) => ({
      projectId: r.projectId,
      milestoneIndex: r.milestoneIndex,
      verified: r.verified,
      evidenceURI: r.evidenceURI,
      dataSources: r.dataSources,
      confidence: r.confidence,
      timestamp: r.timestamp,
    }));
  }

  /**
   * Get project progress
   */
  async getProjectProgress(projectId: string): Promise<{ completed: number; total: number }> {
    const [completed, total] = await this.oracleAggregator.getProjectProgress(projectId);
    return {
      completed: Number(completed),
      total: Number(total),
    };
  }

  /**
   * Setup milestones for a project
   */
  async setupMilestones(
    projectId: string,
    descriptions: string[],
    targetDates: number[]
  ): Promise<string> {
    console.log(`Setting up ${descriptions.length} milestones for project ${projectId}`);
    const tx = await this.oracleAggregator.setupMilestones(
      projectId,
      descriptions,
      targetDates.map(d => BigInt(d))
    );
    const receipt = await tx.wait();
    console.log(`Milestones setup TX: ${receipt.hash}`);
    return receipt.hash;
  }

  /**
   * Verify a milestone
   */
  async verifyMilestone(
    projectId: string,
    milestoneIndex: number,
    verified: boolean,
    evidenceURI: string,
    dataSources: string[],
    confidence: number
  ): Promise<string> {
    console.log(`Verifying milestone ${milestoneIndex} for project ${projectId}`);
    console.log(`  Verified: ${verified}, Confidence: ${confidence}%`);

    const tx = await this.oracleAggregator.verifyMilestone(
      projectId,
      milestoneIndex,
      verified,
      evidenceURI,
      dataSources,
      confidence
    );
    const receipt = await tx.wait();
    console.log(`Verification TX: ${receipt.hash}`);
    return receipt.hash;
  }

  /**
   * Mark a project as failed
   */
  async markProjectFailed(projectId: string, reason: string): Promise<string> {
    console.log(`Marking project ${projectId} as failed: ${reason}`);
    const tx = await this.oracleAggregator.markProjectFailed(projectId, reason);
    const receipt = await tx.wait();
    console.log(`Failed TX: ${receipt.hash}`);
    return receipt.hash;
  }

  /**
   * Get market for a project
   */
  async getMarket(projectId: string): Promise<string | null> {
    const address = await this.marketFactory.getMarket(projectId);
    if (address === ethers.ZeroAddress) {
      return null;
    }
    return address;
  }

  /**
   * Get market prices
   */
  async getMarketPrices(projectId: string): Promise<{ yesPrice: number; noPrice: number } | null> {
    const marketAddress = await this.getMarket(projectId);
    if (!marketAddress) {
      return null;
    }

    const market = new ethers.Contract(marketAddress, LMSR_MARKET_ABI, this.provider);
    const [yesPrice, noPrice] = await Promise.all([
      market.getYesPrice(),
      market.getNoPrice(),
    ]);

    // Prices are in 1e18 format, convert to percentage
    return {
      yesPrice: Number(yesPrice) / 1e18,
      noPrice: Number(noPrice) / 1e18,
    };
  }

  /**
   * Check if market is resolved
   */
  async isMarketResolved(projectId: string): Promise<boolean> {
    const marketAddress = await this.getMarket(projectId);
    if (!marketAddress) {
      return false;
    }

    const market = new ethers.Contract(marketAddress, LMSR_MARKET_ABI, this.provider);
    return await market.resolved();
  }

  private parseProject(result: any): Project {
    return {
      id: result.id,
      metadataURI: result.metadataURI,
      sponsor: result.sponsor,
      fundingGoal: result.fundingGoal,
      fundingRaised: result.fundingRaised,
      bondPrice: result.bondPrice,
      status: Number(result.status) as ProjectStatus,
      createdAt: result.createdAt,
    };
  }
}

export default BlockchainService;
