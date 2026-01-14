/**
 * Vision Service
 * Uses Claude Vision via local claude-service for image analysis
 */

import ClaudeClient from './claude.js';

export interface EvidenceAnalysis {
  analyzed: boolean;
  matchesMilestone: boolean;
  confidence: number;
  observations: string[];
  constructionProgress?: string;
  evidenceType: 'construction' | 'equipment' | 'completion' | 'documentation' | 'unknown';
  concerns?: string[];
}

export interface BeforeAfterAnalysis {
  analyzed: boolean;
  progressDetected: boolean;
  confidence: number;
  changes: string[];
  progressPercentage: number;
}

export class VisionService {
  private claude: ClaudeClient;

  constructor() {
    this.claude = new ClaudeClient();
  }

  /**
   * Analyze evidence image for milestone verification
   */
  async analyzeEvidence(
    imageUrl: string,
    milestoneDescription: string,
    projectType: string
  ): Promise<EvidenceAnalysis> {
    console.log(`Analyzing evidence for milestone: "${milestoneDescription}"`);

    try {
      const prompt = `You are a project verification oracle analyzing evidence for infrastructure projects.

Project Type: ${projectType}
Milestone Description: "${milestoneDescription}"
Image URL: ${imageUrl}

Analyze this image and determine:
1. Does the image show evidence relevant to this milestone?
2. What is the confidence level (0-100) that this milestone is complete?
3. What specific observations support your assessment?
4. What type of evidence is this (construction, equipment, completion, documentation)?
5. Are there any concerns or red flags?

Respond ONLY with valid JSON in this exact format:
{
  "matchesMilestone": boolean,
  "confidence": number,
  "observations": ["observation1", "observation2"],
  "constructionProgress": "description of progress seen",
  "evidenceType": "construction",
  "concerns": ["concern1"] or null
}`;

      const response = await this.claude.chat(prompt, { model: 'sonnet', maxTurns: 1 });

      // Extract JSON from response
      const jsonMatch = response.response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON in response');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      return {
        analyzed: true,
        matchesMilestone: analysis.matchesMilestone,
        confidence: analysis.confidence,
        observations: analysis.observations || [],
        constructionProgress: analysis.constructionProgress,
        evidenceType: analysis.evidenceType || 'unknown',
        concerns: analysis.concerns,
      };
    } catch (error) {
      console.error('Vision analysis error:', error);
      return {
        analyzed: false,
        matchesMilestone: false,
        confidence: 0,
        observations: ['Analysis failed'],
        evidenceType: 'unknown',
        concerns: ['Unable to analyze image'],
      };
    }
  }

  /**
   * Compare before/after images to detect progress
   */
  async analyzeBeforeAfter(
    beforeImageUrl: string,
    afterImageUrl: string,
    expectedChange: string
  ): Promise<BeforeAfterAnalysis> {
    console.log(`Analyzing before/after for: "${expectedChange}"`);

    try {
      const prompt = `Compare these before/after images for an infrastructure project.

BEFORE image: ${beforeImageUrl}
AFTER image: ${afterImageUrl}

Expected change: "${expectedChange}"

Analyze:
1. Is there visible progress between the images?
2. What specific changes can you observe?
3. Estimate the progress percentage (0-100)
4. Confidence level in your assessment (0-100)

Respond ONLY with valid JSON in this exact format:
{
  "progressDetected": boolean,
  "confidence": number,
  "changes": ["change1", "change2"],
  "progressPercentage": number
}`;

      const response = await this.claude.chat(prompt, { model: 'sonnet', maxTurns: 1 });

      const jsonMatch = response.response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON in response');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      return {
        analyzed: true,
        progressDetected: analysis.progressDetected,
        confidence: analysis.confidence,
        changes: analysis.changes || [],
        progressPercentage: analysis.progressPercentage || 0,
      };
    } catch (error) {
      console.error('Before/after analysis error:', error);
      return {
        analyzed: false,
        progressDetected: false,
        confidence: 0,
        changes: ['Analysis failed'],
        progressPercentage: 0,
      };
    }
  }

  /**
   * Analyze satellite/aerial imagery for construction detection
   */
  async analyzeSatelliteImage(
    imageUrl: string,
    expectedFeature: string,
    coordinates: { lat: number; lng: number }
  ): Promise<EvidenceAnalysis> {
    console.log(`Analyzing satellite image for: "${expectedFeature}"`);

    try {
      const prompt = `Analyze this satellite/aerial image for infrastructure verification.

Image URL: ${imageUrl}
Expected Feature: "${expectedFeature}"
Location: ${coordinates.lat}, ${coordinates.lng}

Look for:
1. Signs of construction or new structures
2. Evidence matching the expected feature
3. Land changes indicating development
4. Any visible infrastructure

Respond ONLY with valid JSON in this exact format:
{
  "matchesMilestone": boolean,
  "confidence": number,
  "observations": ["observation1", "observation2"],
  "constructionProgress": "what you can see",
  "evidenceType": "construction",
  "concerns": ["concern1"] or null
}`;

      const response = await this.claude.chat(prompt, { model: 'sonnet', maxTurns: 1 });

      const jsonMatch = response.response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON in response');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      return {
        analyzed: true,
        matchesMilestone: analysis.matchesMilestone,
        confidence: analysis.confidence,
        observations: analysis.observations || [],
        constructionProgress: analysis.constructionProgress,
        evidenceType: analysis.evidenceType || 'unknown',
        concerns: analysis.concerns,
      };
    } catch (error) {
      console.error('Satellite analysis error:', error);
      return {
        analyzed: false,
        matchesMilestone: false,
        confidence: 0,
        observations: ['Analysis failed'],
        evidenceType: 'unknown',
        concerns: ['Unable to analyze satellite image'],
      };
    }
  }
}

export default VisionService;
