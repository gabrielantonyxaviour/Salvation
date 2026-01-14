/**
 * Salvation Oracle Agent
 * Main agent that orchestrates milestone verification and market resolution
 */

import config from './config.js';
import BlockchainService, { Project, Milestone, ProjectStatus } from './services/blockchain.js';
import NewsService, { NewsResult } from './services/news.js';
import MapsService, { LocationResult } from './services/maps.js';
import VisionService, { EvidenceAnalysis } from './services/vision.js';
import AnalysisService, { VerificationDecision, ProjectAnalysis } from './services/analysis.js';
import IPFSService, { ProjectMetadata, VerificationMetadata } from './utils/ipfs.js';

export interface VerificationResult {
  projectId: string;
  milestoneIndex: number;
  decision: VerificationDecision;
  txHash?: string;
  evidenceURI?: string;
  error?: string;
}

export interface ProjectInfo {
  project: Project;
  metadata?: ProjectMetadata;
  milestones: Milestone[];
  progress: { completed: number; total: number };
  marketPrices?: { yesPrice: number; noPrice: number };
}

export class SalvationOracle {
  private blockchain: BlockchainService;
  private newsService: NewsService;
  private mapsService: MapsService;
  private visionService: VisionService;
  private analysisService: AnalysisService;
  private ipfsService: IPFSService;

  constructor() {
    console.log('Initializing Salvation Oracle Agent...');

    this.blockchain = new BlockchainService();
    this.newsService = new NewsService();
    this.mapsService = new MapsService();
    this.visionService = new VisionService();
    this.analysisService = new AnalysisService();
    this.ipfsService = new IPFSService();

    console.log(`Oracle Address: ${this.blockchain.getOracleAddress()}`);
    console.log('Salvation Oracle Agent initialized');
  }

  /**
   * Get oracle wallet address
   */
  getOracleAddress(): string {
    return this.blockchain.getOracleAddress();
  }

  /**
   * Get all projects with their details
   */
  async getAllProjects(): Promise<ProjectInfo[]> {
    const projects = await this.blockchain.getAllProjects();
    const projectInfos: ProjectInfo[] = [];

    for (const project of projects) {
      try {
        const info = await this.getProjectInfo(project.id);
        projectInfos.push(info);
      } catch (error) {
        console.error(`Error fetching project ${project.id}:`, error);
        projectInfos.push({
          project,
          milestones: [],
          progress: { completed: 0, total: 0 },
        });
      }
    }

    return projectInfos;
  }

  /**
   * Get detailed project information
   */
  async getProjectInfo(projectId: string): Promise<ProjectInfo> {
    const project = await this.blockchain.getProject(projectId);
    const milestones = await this.blockchain.getMilestones(projectId);
    const progress = await this.blockchain.getProjectProgress(projectId);

    let metadata: ProjectMetadata | undefined;
    try {
      metadata = await this.ipfsService.fetchProjectMetadata(project.metadataURI);
    } catch (error) {
      console.warn(`Failed to fetch metadata for project ${projectId}`);
    }

    let marketPrices: { yesPrice: number; noPrice: number } | undefined;
    try {
      const prices = await this.blockchain.getMarketPrices(projectId);
      if (prices) {
        marketPrices = prices;
      }
    } catch (error) {
      console.warn(`Failed to fetch market prices for project ${projectId}`);
    }

    return {
      project,
      metadata,
      milestones,
      progress,
      marketPrices,
    };
  }

  /**
   * Verify a milestone for a project
   */
  async verifyMilestone(
    projectId: string,
    milestoneIndex: number,
    evidenceUrl?: string
  ): Promise<VerificationResult> {
    console.log(`\n========================================`);
    console.log(`Verifying milestone ${milestoneIndex} for project ${projectId}`);
    console.log(`========================================\n`);

    try {
      // Get project info
      const projectInfo = await this.getProjectInfo(projectId);
      const { project, metadata, milestones } = projectInfo;

      if (milestoneIndex >= milestones.length) {
        throw new Error(`Invalid milestone index: ${milestoneIndex}`);
      }

      if (milestones[milestoneIndex].completed) {
        throw new Error(`Milestone ${milestoneIndex} is already completed`);
      }

      const milestone = milestones[milestoneIndex];

      // Extract project details
      const projectName = metadata?.name || `Project ${projectId.slice(0, 10)}`;
      const projectDescription = metadata?.description || '';
      const projectType = metadata?.category || 'infrastructure';
      const location = metadata?.location || { country: '', region: '', coordinates: [0, 0] as [number, number] };

      console.log(`Project: ${projectName}`);
      console.log(`Milestone: ${milestone.description}`);
      console.log(`Location: ${location.region}, ${location.country}`);

      // 1. Check news for project mentions
      console.log('\n[1/4] Checking news coverage...');
      const newsResult = await this.newsService.checkProjectNews(
        projectName,
        `${location.region} ${location.country}`,
        [projectType, milestone.description]
      );
      console.log(`  Found ${newsResult.relevantMentions} relevant news articles`);

      // 2. Verify location
      console.log('\n[2/4] Verifying location...');
      const locationResult = await this.mapsService.verifyLocation(
        location.coordinates[0],
        location.coordinates[1],
        `${location.region}, ${location.country}`
      );
      console.log(`  Location verified: ${locationResult.verified}`);

      // 3. Analyze evidence (if provided)
      console.log('\n[3/4] Analyzing evidence...');
      let evidenceResult: EvidenceAnalysis | null = null;
      if (evidenceUrl) {
        evidenceResult = await this.visionService.analyzeEvidence(
          evidenceUrl,
          milestone.description,
          projectType
        );
        console.log(`  Evidence matches milestone: ${evidenceResult.matchesMilestone}`);
      } else {
        console.log('  No evidence URL provided');
      }

      // 4. Synthesize verification decision
      console.log('\n[4/4] Synthesizing decision...');
      const decision = await this.analysisService.synthesizeVerification({
        projectName,
        projectDescription,
        projectType,
        milestoneDescription: milestone.description,
        milestoneIndex,
        news: newsResult,
        location: locationResult,
        evidence: evidenceResult,
      });

      console.log(`\nDecision: ${decision.verified ? 'VERIFIED' : 'NOT VERIFIED'}`);
      console.log(`Confidence: ${decision.confidence}%`);
      console.log(`Recommended Action: ${decision.recommendedAction}`);
      console.log(`Reasoning: ${decision.reasoning}`);

      // If verified and confidence is sufficient, submit to blockchain
      if (decision.verified && decision.confidence >= config.verification.minConfidence) {
        console.log('\nSubmitting verification to blockchain...');

        // Upload evidence to IPFS
        const verificationMetadata: VerificationMetadata = {
          projectId,
          milestoneIndex,
          timestamp: Date.now(),
          verified: true,
          confidence: decision.confidence,
          dataSources: decision.dataSources,
          reasoning: decision.reasoning,
          newsArticles: newsResult.articles.slice(0, 5).map(a => ({
            title: a.title,
            url: a.url,
            source: a.source,
          })),
          locationData: {
            verified: locationResult.verified,
            displayName: locationResult.locationData?.displayName || '',
            matchScore: locationResult.matchScore,
          },
          evidenceAnalysis: evidenceResult ? {
            analyzed: evidenceResult.analyzed,
            matchesMilestone: evidenceResult.matchesMilestone,
            observations: evidenceResult.observations,
          } : undefined,
        };

        let evidenceURI = '';
        if (this.ipfsService.isConfigured()) {
          const ipfsResult = await this.ipfsService.uploadVerificationEvidence(verificationMetadata);
          evidenceURI = ipfsResult.cid;
          console.log(`Evidence uploaded to IPFS: ${evidenceURI}`);
        }

        // Submit to contract
        const txHash = await this.blockchain.verifyMilestone(
          projectId,
          milestoneIndex,
          true,
          evidenceURI,
          decision.dataSources,
          decision.confidence
        );

        return {
          projectId,
          milestoneIndex,
          decision,
          txHash,
          evidenceURI,
        };
      }

      return {
        projectId,
        milestoneIndex,
        decision,
      };
    } catch (error: any) {
      console.error('Verification error:', error);
      return {
        projectId,
        milestoneIndex,
        decision: {
          verified: false,
          confidence: 0,
          reasoning: error.message || 'Verification failed',
          dataSources: [],
          recommendedAction: 'manual_review',
          concerns: [error.message],
        },
        error: error.message,
      };
    }
  }

  /**
   * Analyze a new project submission
   */
  async analyzeNewProject(projectId: string): Promise<ProjectAnalysis> {
    console.log(`Analyzing new project: ${projectId}`);

    const projectInfo = await this.getProjectInfo(projectId);
    const { project, metadata } = projectInfo;

    if (!metadata) {
      throw new Error('Project metadata not found');
    }

    const location = metadata.location;

    // Check news
    const newsResult = await this.newsService.checkProjectNews(
      metadata.name,
      `${location.region} ${location.country}`,
      [metadata.category]
    );

    // Verify location
    const locationResult = await this.mapsService.verifyLocation(
      location.coordinates[0],
      location.coordinates[1],
      `${location.region}, ${location.country}`
    );

    // Analyze project
    const analysis = await this.analysisService.analyzeProject(
      metadata.name,
      metadata.description,
      metadata.category,
      { country: location.country, region: location.region },
      Number(project.fundingGoal) / 1e6, // Assuming USDC with 6 decimals
      newsResult,
      locationResult
    );

    return analysis;
  }

  /**
   * Setup milestones for a project
   */
  async setupMilestones(
    projectId: string,
    descriptions: string[],
    targetDates: number[]
  ): Promise<string> {
    return this.blockchain.setupMilestones(projectId, descriptions, targetDates);
  }

  /**
   * Mark a project as failed
   */
  async markProjectFailed(projectId: string, reason: string): Promise<string> {
    return this.blockchain.markProjectFailed(projectId, reason);
  }

  /**
   * Get verification status for a project
   */
  async getVerificationStatus(projectId: string): Promise<{
    progress: { completed: number; total: number };
    milestones: Array<{
      index: number;
      description: string;
      completed: boolean;
      completedAt: number;
      targetDate: number;
    }>;
  }> {
    const milestones = await this.blockchain.getMilestones(projectId);
    const progress = await this.blockchain.getProjectProgress(projectId);

    return {
      progress,
      milestones: milestones.map((m, i) => ({
        index: i,
        description: m.description,
        completed: m.completed,
        completedAt: Number(m.completedAt),
        targetDate: Number(m.targetDate),
      })),
    };
  }
}

export default SalvationOracle;
