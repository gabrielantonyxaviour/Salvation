/**
 * Analysis Service
 * AI-powered synthesis of all verification data
 */

import ClaudeClient from './claude.js';
import { NewsResult } from './news.js';
import { LocationResult } from './maps.js';
import { EvidenceAnalysis } from './vision.js';

export interface VerificationData {
  projectName: string;
  projectDescription: string;
  projectType: string;
  milestoneDescription: string;
  milestoneIndex: number;
  news: NewsResult;
  location: LocationResult;
  evidence: EvidenceAnalysis | null;
}

export interface VerificationDecision {
  verified: boolean;
  confidence: number;
  reasoning: string;
  dataSources: string[];
  recommendedAction: 'verify' | 'reject' | 'manual_review';
  concerns?: string[];
}

export interface ProjectAnalysis {
  projectName: string;
  projectDescription: string;
  legitimacyScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  concerns: string[];
  recommendations: string[];
  locationVerified: boolean;
  newsPresence: boolean;
}

export class AnalysisService {
  private claude: ClaudeClient;

  constructor() {
    this.claude = new ClaudeClient();
  }

  /**
   * Synthesize all verification data into a decision
   */
  async synthesizeVerification(data: VerificationData): Promise<VerificationDecision> {
    console.log(`Synthesizing verification for milestone: "${data.milestoneDescription}"`);

    const dataSources: string[] = [];

    // Collect data sources used
    if (data.news.sources.length > 0) {
      dataSources.push(...data.news.sources);
    }
    if (data.location.verified) {
      dataSources.push('OpenStreetMap');
    }
    if (data.evidence?.analyzed) {
      dataSources.push('Claude Vision');
    }

    try {
      const prompt = `You are a project verification oracle for infrastructure development in Africa.

PROJECT INFORMATION:
- Name: ${data.projectName}
- Type: ${data.projectType}
- Description: ${data.projectDescription}

MILESTONE TO VERIFY:
- Index: ${data.milestoneIndex}
- Description: "${data.milestoneDescription}"

VERIFICATION DATA:

1. NEWS VERIFICATION:
- News found: ${data.news.found}
- Total articles: ${data.news.totalResults}
- Relevant mentions: ${data.news.relevantMentions}
- News confidence: ${data.news.confidence}%
- Top headlines: ${data.news.articles.slice(0, 3).map(a => a.title).join('; ')}

2. LOCATION VERIFICATION:
- Location verified: ${data.location.verified}
- Match score: ${(data.location.matchScore * 100).toFixed(0)}%
- Location confidence: ${data.location.confidence}%
- Country match: ${data.location.details.countryMatch}
- Region match: ${data.location.details.regionMatch}
${data.location.locationData ? `- Resolved to: ${data.location.locationData.displayName}` : ''}

3. EVIDENCE ANALYSIS:
${data.evidence ? `
- Evidence analyzed: ${data.evidence.analyzed}
- Matches milestone: ${data.evidence.matchesMilestone}
- Evidence confidence: ${data.evidence.confidence}%
- Evidence type: ${data.evidence.evidenceType}
- Observations: ${data.evidence.observations.join('; ')}
${data.evidence.concerns ? `- Concerns: ${data.evidence.concerns.join('; ')}` : ''}
` : '- No evidence submitted'}

Based on this data, make a verification decision.

Respond ONLY with valid JSON in this exact format:
{
  "verified": boolean,
  "confidence": number,
  "reasoning": "detailed explanation of decision",
  "recommendedAction": "verify" or "reject" or "manual_review",
  "concerns": ["concern1"] or null
}

DECISION GUIDELINES:
- Require confidence > 70% for automatic verification
- If evidence is missing but news/location are strong, recommend manual review
- Flag any inconsistencies or red flags
- Be conservative - it's better to recommend manual review than wrongly verify`;

      const response = await this.claude.chat(prompt, { model: 'sonnet', maxTurns: 1 });

      const jsonMatch = response.response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON in response');
      }

      const decision = JSON.parse(jsonMatch[0]);

      return {
        verified: decision.verified,
        confidence: decision.confidence,
        reasoning: decision.reasoning,
        dataSources,
        recommendedAction: decision.recommendedAction,
        concerns: decision.concerns,
      };
    } catch (error) {
      console.error('Synthesis error:', error);
      return {
        verified: false,
        confidence: 0,
        reasoning: 'Analysis failed due to error',
        dataSources,
        recommendedAction: 'manual_review',
        concerns: ['Automated analysis failed'],
      };
    }
  }

  /**
   * Analyze a new project submission for legitimacy
   */
  async analyzeProject(
    projectName: string,
    projectDescription: string,
    projectType: string,
    location: { country: string; region: string },
    fundingGoal: number,
    news: NewsResult,
    locationResult: LocationResult
  ): Promise<ProjectAnalysis> {
    console.log(`Analyzing project legitimacy: "${projectName}"`);

    try {
      const prompt = `You are analyzing a new infrastructure project submission for legitimacy.

PROJECT DETAILS:
- Name: ${projectName}
- Type: ${projectType}
- Description: ${projectDescription}
- Location: ${location.region}, ${location.country}
- Funding Goal: $${fundingGoal.toLocaleString()}

VERIFICATION DATA:

1. NEWS PRESENCE:
- Found news coverage: ${news.found}
- Total articles: ${news.totalResults}
- Relevant mentions: ${news.relevantMentions}

2. LOCATION VERIFICATION:
- Location verified: ${locationResult.verified}
- Match score: ${(locationResult.matchScore * 100).toFixed(0)}%
${locationResult.locationData ? `- Resolved to: ${locationResult.locationData.displayName}` : ''}

Analyze this project and provide:
1. Legitimacy score (0-100)
2. Risk level (low/medium/high)
3. Any concerns or red flags
4. Recommendations

Respond ONLY with valid JSON in this exact format:
{
  "legitimacyScore": number,
  "riskLevel": "low" or "medium" or "high",
  "concerns": ["concern1", "concern2"],
  "recommendations": ["rec1", "rec2"]
}`;

      const response = await this.claude.chat(prompt, { model: 'sonnet', maxTurns: 1 });

      const jsonMatch = response.response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON in response');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      return {
        projectName,
        projectDescription,
        legitimacyScore: analysis.legitimacyScore,
        riskLevel: analysis.riskLevel,
        concerns: analysis.concerns || [],
        recommendations: analysis.recommendations || [],
        locationVerified: locationResult.verified,
        newsPresence: news.found,
      };
    } catch (error) {
      console.error('Project analysis error:', error);
      return {
        projectName,
        projectDescription,
        legitimacyScore: 0,
        riskLevel: 'high',
        concerns: ['Unable to analyze project'],
        recommendations: ['Manual review required'],
        locationVerified: locationResult.verified,
        newsPresence: news.found,
      };
    }
  }

  /**
   * Generate a human-readable verification report
   */
  async generateReport(
    data: VerificationData,
    decision: VerificationDecision
  ): Promise<string> {
    try {
      const prompt = `Generate a concise verification report for this milestone:

Project: ${data.projectName}
Milestone: ${data.milestoneDescription}
Decision: ${decision.verified ? 'VERIFIED' : 'NOT VERIFIED'}
Confidence: ${decision.confidence}%
Reasoning: ${decision.reasoning}

Data sources used: ${decision.dataSources.join(', ')}
${decision.concerns ? `Concerns: ${decision.concerns.join(', ')}` : ''}

Write a professional 2-3 paragraph report summarizing the verification process and decision.`;

      const response = await this.claude.chat(prompt, { model: 'sonnet', maxTurns: 1 });
      return response.response;
    } catch (error) {
      console.error('Report generation error:', error);
      return `Verification ${decision.verified ? 'APPROVED' : 'REJECTED'} with ${decision.confidence}% confidence. ${decision.reasoning}`;
    }
  }
}

export default AnalysisService;
