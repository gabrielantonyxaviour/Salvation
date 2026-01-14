/**
 * Salvation Oracle Agent Server
 *
 * API server for infrastructure bond verification on Mantle network
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { SalvationOracle } from './agent.js';
import config, { validateConfig } from './config.js';

const PORT = config.port;
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize Oracle Agent
let oracle: SalvationOracle | null = null;

console.log('\n========================================');
console.log('Salvation Oracle Agent Server');
console.log('========================================\n');

// Validate configuration
if (!validateConfig()) {
  console.error('Configuration validation failed. Some features may not work.');
}

try {
  oracle = new SalvationOracle();
  console.log('Oracle Agent initialized successfully\n');
} catch (error) {
  console.error('Failed to initialize Oracle Agent:', error);
}

// ============ Health & Status Endpoints ============

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    oracleInitialized: oracle !== null,
    oracleAddress: oracle?.getOracleAddress() || null,
  });
});

/**
 * Get oracle status and configuration
 */
app.get('/status', (req, res) => {
  res.json({
    oracleInitialized: oracle !== null,
    oracleAddress: oracle?.getOracleAddress() || null,
    chainId: config.chainId,
    contracts: {
      projectRegistry: config.contracts.projectRegistry,
      oracleAggregator: config.contracts.oracleAggregator,
      marketFactory: config.contracts.marketFactory,
    },
    verification: config.verification,
  });
});

// ============ Project Endpoints ============

/**
 * Get all projects
 */
app.get('/projects', async (req, res) => {
  if (!oracle) {
    return res.status(503).json({ error: 'Oracle not initialized' });
  }

  try {
    const projects = await oracle.getAllProjects();
    res.json({ projects });
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get project by ID
 */
app.get('/projects/:projectId', async (req, res) => {
  if (!oracle) {
    return res.status(503).json({ error: 'Oracle not initialized' });
  }

  try {
    const { projectId } = req.params;
    const project = await oracle.getProjectInfo(projectId);
    res.json(project);
  } catch (error: any) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get verification status for a project
 */
app.get('/status/:projectId', async (req, res) => {
  if (!oracle) {
    return res.status(503).json({ error: 'Oracle not initialized' });
  }

  try {
    const { projectId } = req.params;
    const status = await oracle.getVerificationStatus(projectId);
    res.json(status);
  } catch (error: any) {
    console.error('Error fetching status:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ Verification Endpoints ============

/**
 * Trigger milestone verification
 */
app.post('/verify', async (req, res) => {
  if (!oracle) {
    return res.status(503).json({ error: 'Oracle not initialized' });
  }

  try {
    const { projectId, milestoneIndex, evidenceUrl } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    if (milestoneIndex === undefined || milestoneIndex === null) {
      return res.status(400).json({ error: 'milestoneIndex is required' });
    }

    console.log(`\nVerification request received:`);
    console.log(`  Project: ${projectId}`);
    console.log(`  Milestone: ${milestoneIndex}`);
    console.log(`  Evidence: ${evidenceUrl || 'none'}`);

    const result = await oracle.verifyMilestone(
      projectId,
      milestoneIndex,
      evidenceUrl
    );

    res.json(result);
  } catch (error: any) {
    console.error('Verification error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Analyze a new project submission
 */
app.post('/analyze-project', async (req, res) => {
  if (!oracle) {
    return res.status(503).json({ error: 'Oracle not initialized' });
  }

  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    console.log(`\nProject analysis request: ${projectId}`);

    const analysis = await oracle.analyzeNewProject(projectId);
    res.json(analysis);
  } catch (error: any) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Setup milestones for a project
 */
app.post('/setup-milestones', async (req, res) => {
  if (!oracle) {
    return res.status(503).json({ error: 'Oracle not initialized' });
  }

  try {
    const { projectId, descriptions, targetDates } = req.body;

    if (!projectId || !descriptions || !targetDates) {
      return res.status(400).json({
        error: 'projectId, descriptions, and targetDates are required',
      });
    }

    if (descriptions.length !== targetDates.length) {
      return res.status(400).json({
        error: 'descriptions and targetDates must have the same length',
      });
    }

    console.log(`\nSetting up milestones for project: ${projectId}`);

    const txHash = await oracle.setupMilestones(
      projectId,
      descriptions,
      targetDates
    );

    res.json({ success: true, txHash });
  } catch (error: any) {
    console.error('Setup milestones error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Mark a project as failed
 */
app.post('/mark-failed', async (req, res) => {
  if (!oracle) {
    return res.status(503).json({ error: 'Oracle not initialized' });
  }

  try {
    const { projectId, reason } = req.body;

    if (!projectId || !reason) {
      return res.status(400).json({
        error: 'projectId and reason are required',
      });
    }

    console.log(`\nMarking project ${projectId} as failed: ${reason}`);

    const txHash = await oracle.markProjectFailed(projectId, reason);
    res.json({ success: true, txHash });
  } catch (error: any) {
    console.error('Mark failed error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ Demo Endpoints ============

/**
 * Demo verification (simulated for testing)
 */
app.post('/demo/verify', async (req, res) => {
  try {
    const { projectName, milestone, location } = req.body;

    console.log('\n========================================');
    console.log('DEMO Verification');
    console.log('========================================\n');
    console.log(`Project: ${projectName}`);
    console.log(`Milestone: ${milestone}`);
    console.log(`Location: ${location}`);

    // Simulate verification steps
    const steps = [
      { step: 'news', description: 'Checking news coverage...', delay: 1000 },
      { step: 'location', description: 'Verifying location...', delay: 800 },
      { step: 'analysis', description: 'Synthesizing decision...', delay: 1200 },
    ];

    const results: any[] = [];

    for (const step of steps) {
      console.log(`\n[${step.step}] ${step.description}`);
      await new Promise(resolve => setTimeout(resolve, step.delay));

      results.push({
        step: step.step,
        status: 'complete',
        confidence: Math.floor(70 + Math.random() * 25),
      });
    }

    const finalConfidence = Math.floor(
      results.reduce((sum, r) => sum + r.confidence, 0) / results.length
    );

    const decision = {
      verified: finalConfidence >= 70,
      confidence: finalConfidence,
      reasoning: `Based on ${results.length} verification sources, the milestone appears ${finalConfidence >= 70 ? 'legitimate' : 'questionable'}.`,
      dataSources: ['NewsAPI', 'GDELT', 'OpenStreetMap', 'Claude Vision'],
      recommendedAction: finalConfidence >= 70 ? 'verify' : 'manual_review',
    };

    console.log(`\nDecision: ${decision.verified ? 'VERIFIED' : 'NEEDS REVIEW'}`);
    console.log(`Confidence: ${decision.confidence}%`);

    res.json({
      demo: true,
      projectName,
      milestone,
      location,
      steps: results,
      decision,
    });
  } catch (error: any) {
    console.error('Demo error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ Start Server ============

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`Salvation Oracle Agent Server`);
  console.log(`========================================`);
  console.log(`Port: ${PORT}`);
  console.log(`Oracle: ${oracle ? oracle.getOracleAddress() : 'NOT INITIALIZED'}`);
  console.log(`Chain: Mantle Sepolia (${config.chainId})`);
  console.log(`========================================\n`);
  console.log(`Endpoints:`);
  console.log(`  GET  /health              - Health check`);
  console.log(`  GET  /status              - Oracle status`);
  console.log(`  GET  /projects            - List all projects`);
  console.log(`  GET  /projects/:id        - Get project details`);
  console.log(`  GET  /status/:id          - Get verification status`);
  console.log(`  POST /verify              - Verify a milestone`);
  console.log(`  POST /analyze-project     - Analyze new project`);
  console.log(`  POST /setup-milestones    - Setup project milestones`);
  console.log(`  POST /mark-failed         - Mark project as failed`);
  console.log(`  POST /demo/verify         - Demo verification flow`);
  console.log(`\n`);
});

export default app;
