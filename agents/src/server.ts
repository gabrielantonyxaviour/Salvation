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

// ============ Application Review Endpoints ============

/**
 * Review an application (off-chain project submission)
 * This handles the chat-based review process before on-chain creation
 */
app.post('/analyze-application', async (req, res) => {
  try {
    const { prompt, application, history, startAnalysis } = req.body;

    if (!prompt && !application) {
      return res.status(400).json({ error: 'prompt or application is required' });
    }

    console.log('\n========================================');
    console.log('Application Review Request');
    console.log('========================================\n');

    let responseText = '';

    if (startAnalysis && application) {
      // Initial analysis - gather data and provide comprehensive review
      console.log(`Analyzing application: ${application.project_name}`);
      console.log(`Location: ${application.region}, ${application.country}`);
      console.log(`Category: ${application.category}`);
      console.log(`Funding: $${application.funding_goal}`);

      // Use services if oracle is available
      let newsInfo = '';
      let locationInfo = '';

      if (oracle) {
        try {
          // Check news coverage
          const newsService = (oracle as any).newsService;
          if (newsService) {
            const newsResult = await newsService.checkProjectNews(
              application.project_name,
              `${application.region} ${application.country}`,
              [application.category]
            );
            newsInfo = `\nNews Coverage: Found ${newsResult.totalResults} articles, ${newsResult.relevantMentions} relevant mentions.`;
            if (newsResult.articles.length > 0) {
              newsInfo += `\nTop headlines: ${newsResult.articles.slice(0, 3).map((a: any) => a.title).join('; ')}`;
            }
          }

          // Verify location
          const mapsService = (oracle as any).mapsService;
          if (mapsService && application.latitude && application.longitude) {
            const locationResult = await mapsService.verifyLocation(
              application.latitude,
              application.longitude,
              `${application.region}, ${application.country}`
            );
            locationInfo = `\nLocation Verification: ${locationResult.verified ? 'Verified' : 'Unverified'} (${(locationResult.matchScore * 100).toFixed(0)}% match)`;
            if (locationResult.locationData) {
              locationInfo += `\nResolved to: ${locationResult.locationData.displayName}`;
            }
          }
        } catch (error) {
          console.log('External data gathering had errors, continuing with prompt-based analysis');
        }
      }

      // Build comprehensive analysis prompt with Amara's persona
      const analysisPrompt = `${AMARA_PERSONA}

You are reviewing a new project application. This is your initial analysis - be warm and encouraging while being thorough about your assessment.

PROJECT APPLICATION:
- Name: ${application.project_name}
- Category: ${application.category}
- Location: ${application.region}, ${application.country}
${application.latitude && application.longitude ? `- Coordinates: ${application.latitude}, ${application.longitude}` : ''}
- Description: ${application.description}
- Funding Goal: $${Number(application.funding_goal).toLocaleString()} USDC
- Bond Price: $${application.bond_price} per bond
- Projected APY: ${application.projected_apy}%
- Revenue Model: ${application.revenue_model}
- Milestones: ${JSON.stringify(application.milestones, null, 2)}
${newsInfo}
${locationInfo}

Provide your initial analysis. Include these sections (use your warm, conversational voice):

## First Impressions
Share your gut reaction - what excites you about this project?

## What I Love
Highlight the strengths you see in this application.

## Let's Talk About...
Areas that concern you or need clarification - be direct but supportive.

## Questions for You
The specific questions you need answered. Ask like you're genuinely curious, not interrogating.

## Initial Thoughts on Terms
Any suggestions about the funding amount, APY, or milestones.

Remember: You want this project to succeed! Start a genuine dialogue. Do NOT approve yet - you need more information first.`;

      // Call Claude for analysis - NO FALLBACK, throw error if fails
      const ClaudeClient = (await import('./services/claude.js')).default;
      const claude = new ClaudeClient();
      const result = await claude.chat(analysisPrompt, { model: 'sonnet', maxTurns: 1 });
      responseText = result.response;
    } else if (prompt) {
      // Follow-up conversation - NO FALLBACK, throw error if fails
      const conversationPrompt = buildConversationPrompt(application, history || [], prompt);

      const ClaudeClient = (await import('./services/claude.js')).default;
      const claude = new ClaudeClient();
      const result = await claude.chat(conversationPrompt, { model: 'sonnet', maxTurns: 1 });
      responseText = result.response;
    }

    console.log(`\nResponse generated (${responseText.length} chars)`);

    res.json({
      response: responseText,
      analysis: responseText,
    });
  } catch (error: any) {
    console.error('Application review error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Amara Okonkwo - The Development Advisor
// Former World Bank infrastructure analyst who left to help grassroots projects get fair funding.
// Warm but thorough, asks probing questions with genuine curiosity, celebrates good projects.
const AMARA_PERSONA = `You are Amara Okonkwo, a former World Bank infrastructure analyst who now reviews project applications for Salvation, a decentralized bond platform funding African infrastructure.

PERSONALITY:
- Warm, encouraging, but thorough - you genuinely want projects to succeed
- You've seen hundreds of projects succeed and fail, so you know what works
- You ask probing questions out of genuine curiosity, not skepticism
- You celebrate strengths while being direct about concerns
- You think like both an investor AND a community advocate
- You use conversational language, occasionally sharing relevant experiences

VOICE EXAMPLES:
- "I love what you're building here! Let me ask a few questions to make sure we set you up for success."
- "This reminds me of a solar project in Tanzania that faced similar challenges..."
- "Your team's experience is impressive. Now, let's talk about the funding allocation..."
- "I want to be direct with you - the APY projection concerns me. Here's why..."`;

// Helper functions for application review
function buildConversationPrompt(application: any, history: any[], userMessage: string): string {
  const historyText = history
    .filter((m: any) => m.role !== 'system')
    .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');

  return `${AMARA_PERSONA}

PROJECT UNDER REVIEW: ${application?.project_name || 'Unknown'} (${application?.category || 'infrastructure'})
Location: ${application?.region || 'Unknown'}, ${application?.country || 'Unknown'}
Funding: $${application?.funding_goal?.toLocaleString() || '0'} at ${application?.projected_apy || '0'}% APY

CONVERSATION HISTORY:
${historyText}

APPLICANT: ${userMessage}

Respond as Amara. Continue the review process with your characteristic warmth and thoroughness.

GUIDELINES:
- If the applicant has satisfactorily addressed your concerns and the project looks viable, warmly indicate you're ready to APPROVE
- If there are still issues, be direct but supportive about what needs addressing
- Share relevant insights from your experience when helpful
- Celebrate wins and acknowledge good answers

If you decide to approve, say something like "I'm genuinely excited about this project - I'm ready to APPROVE this application!" and summarize the final agreed terms.`;
}

function generateFallbackAnalysis(application: any): string {
  return `## First Impressions

Hello! I'm Amara, and I'm genuinely excited to review **${application.project_name}**. ${application.category} projects in ${application.region}, ${application.country} are exactly what Salvation was built for - bringing real infrastructure funding to communities that need it.

## What I Love

Let me tell you what caught my eye:
- You've put together a clear vision with defined milestones - that tells me you've thought this through
- The revenue model (${application.revenue_model}) shows you're thinking about sustainability, not just the initial build
- $${Number(application.funding_goal).toLocaleString()} is an ambitious but focused goal

## Let's Talk About...

Now, I want to set you up for success, so let me be direct about a few things:

1. **The Numbers**: Your ${application.projected_apy}% APY projection is interesting. I've seen similar projects succeed and struggle with these targets - I'd love to understand your assumptions better.

2. **The Budget**: How are you planning to allocate that $${Number(application.funding_goal).toLocaleString()}? A detailed breakdown really helps our investors feel confident.

3. **Risk Planning**: What happens if things don't go according to plan? Weather delays, permit issues, supply chain problems - I've seen them all. What's your backup plan?

## Questions for You

I'm genuinely curious about a few things:
- Have you started any conversations with local authorities about permits or approvals?
- What's your team's experience with projects like this? Even similar smaller projects count!
- How are you planning to keep bond holders in the loop as the project progresses?

## Initial Thoughts on Terms

Let's keep this conversation going! Once I understand more about your approach, we can fine-tune the funding terms together. I want this to work for everyone - you, the community, and our investors.

Looking forward to your responses! 🌍`;
}

function generateFallbackResponse(userMessage: string): string {
  return `Thanks for sharing that! I appreciate you taking the time to explain.

This is really helpful context. A few things are becoming clearer to me now, but I'd love to dig a bit deeper:

1. **Timeline**: Walk me through how you see the implementation unfolding. What are the key milestones we should be tracking?

2. **Team**: Tell me more about who's driving this. Your team's experience matters a lot - even adjacent experience counts!

3. **Contingencies**: What keeps you up at night about this project? Understanding your risks helps me understand your planning.

I've reviewed hundreds of projects, and the ones that succeed are usually the ones where the team has really thought through the "what ifs." Let's make sure yours is one of them! 💪`;
}

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
  console.log(`  POST /analyze-application - Review application chat`);
  console.log(`  POST /setup-milestones    - Setup project milestones`);
  console.log(`  POST /mark-failed         - Mark project as failed`);
  console.log(`  POST /demo/verify         - Demo verification flow`);
  console.log(`\n`);
});

export default app;
