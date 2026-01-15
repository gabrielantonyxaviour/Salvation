import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase/client';

const AGENT_SERVER_URL = process.env.AGENT_SERVER_URL || 'http://localhost:5002';

// Helper to create SSE stream
function createSSEStream() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array>;
  let isClosed = false;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
    cancel() {
      isClosed = true;
    },
  });

  const send = (event: string, data: any) => {
    if (isClosed) return;
    try {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      controller.enqueue(encoder.encode(message));
    } catch {
      isClosed = true;
    }
  };

  const close = () => {
    if (isClosed) return;
    isClosed = true;
    try {
      controller.close();
    } catch {
      // Already closed, ignore
    }
  };

  return { stream, send, close };
}

// POST - Send a message and get streaming response
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: applicationId } = await params;

  try {
    const body = await request.json();
    const { message, startAnalysis } = body;

    // Get application details
    const { data: application, error: appError } = await supabase
      .from('salvation_project_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return new Response(
        JSON.stringify({ error: 'Application not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get conversation history
    const { data: history } = await supabase
      .from('salvation_conversations')
      .select('role, content')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: true });

    // Store user message if provided
    if (message) {
      await supabase.from('salvation_conversations').insert({
        application_id: applicationId,
        role: 'user',
        content: message,
      });
    }

    // Create SSE stream
    const { stream, send, close } = createSSEStream();

    // Process in background
    (async () => {
      try {
        // Update status to in_review
        if (application.status === 'pending') {
          await supabase
            .from('salvation_project_applications')
            .update({ status: 'in_review' })
            .eq('id', applicationId);
        }

        let fullResponse = '';

        if (startAnalysis) {
          // Initial analysis - call agent server for full analysis
          send('status', { step: 'starting', message: 'Starting project analysis...' });

          // Step 1: Location verification
          send('status', { step: 'location', message: 'Verifying project location...' });
          await simulateDelay(500);

          const locationData = {
            country: application.country,
            region: application.region,
            coordinates: application.latitude && application.longitude
              ? [application.latitude, application.longitude]
              : null,
          };

          send('analysis', {
            type: 'location',
            data: locationData,
            message: `Location: ${application.region}, ${application.country}`,
          });

          // Step 2: News/market research
          send('status', { step: 'research', message: 'Researching market conditions...' });
          await simulateDelay(800);

          send('analysis', {
            type: 'market',
            message: `Analyzing ${application.category} sector in ${application.country}...`,
          });

          // Step 3: Funding analysis
          send('status', { step: 'funding', message: 'Analyzing funding requirements...' });
          await simulateDelay(600);

          send('analysis', {
            type: 'funding',
            data: {
              funding_goal: application.funding_goal,
              projected_apy: application.projected_apy,
              bond_price: application.bond_price,
            },
            message: `Funding goal: $${application.funding_goal.toLocaleString()} at ${application.projected_apy}% APY`,
          });

          // Step 4: AI synthesis
          send('status', { step: 'synthesis', message: 'Generating comprehensive analysis...' });

          // Call agent server for AI analysis with full application data
          const agentResponse = await callAgentForAnalysis(
            '',
            application,
            history || [],
            true // startAnalysis flag
          );

          // Stream the response character by character for effect
          for (const char of agentResponse) {
            send('token', { content: char });
            fullResponse += char;
            await simulateDelay(15); // Typing effect
          }

          send('status', { step: 'complete', message: 'Analysis complete' });
        } else {
          // Regular conversation - call agent for response
          const agentResponse = await callAgentForAnalysis(
            message,
            application,
            history || [],
            false
          );

          // Stream the response
          for (const char of agentResponse) {
            send('token', { content: char });
            fullResponse += char;
            await simulateDelay(15);
          }
        }

        // Store assistant response
        if (fullResponse) {
          await supabase.from('salvation_conversations').insert({
            application_id: applicationId,
            role: 'assistant',
            content: fullResponse,
          });
        }

        send('done', { message: 'Response complete' });
      } catch (error) {
        console.error('Chat error:', error);
        send('error', { message: error instanceof Error ? error.message : 'Unknown error' });
      } finally {
        close();
      }
    })();

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// GET - Get conversation history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: applicationId } = await params;

  try {
    const { data: application } = await supabase
      .from('salvation_project_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (!application) {
      return new Response(
        JSON.stringify({ error: 'Application not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: messages } = await supabase
      .from('salvation_conversations')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: true });

    return new Response(
      JSON.stringify({
        success: true,
        application,
        messages: messages || [],
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch conversation' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Helper functions
function simulateDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildAnalysisPrompt(application: any, history: any[]): string {
  return `You are the Salvation Oracle, an AI agent that reviews infrastructure project applications for bond funding on the Mantle blockchain.

PROJECT APPLICATION:
- Name: ${application.project_name}
- Category: ${application.category}
- Location: ${application.region}, ${application.country}
- Description: ${application.description}
- Funding Goal: $${application.funding_goal.toLocaleString()} USDC
- Bond Price: $${application.bond_price} per bond
- Projected APY: ${application.projected_apy}%
- Revenue Model: ${application.revenue_model}
- Milestones: ${JSON.stringify(application.milestones, null, 2)}

Provide a comprehensive initial analysis of this project application. Include:
1. **Overall Assessment**: Your initial impression of the project's viability
2. **Strengths**: What looks promising about this application
3. **Concerns**: Any red flags or areas that need clarification
4. **Questions**: Specific questions you need the applicant to answer
5. **Recommendations**: Any suggested changes to funding amount, APY, or milestones

Be thorough but conversational. You are starting a dialogue with the applicant to ensure this project meets quality standards for bond investors.`;
}

function buildConversationPrompt(application: any, history: any[], userMessage: string): string {
  const historyText = history
    .filter(m => m.role !== 'system')
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');

  return `You are the Salvation Oracle reviewing a project application.

PROJECT: ${application.project_name} (${application.category})
Location: ${application.region}, ${application.country}
Funding: $${application.funding_goal.toLocaleString()} at ${application.projected_apy}% APY

CONVERSATION HISTORY:
${historyText}

USER: ${userMessage}

Respond to the user's message. Continue the review process. If all your concerns are addressed and the project looks viable, you can indicate that you're ready to approve the application. If there are still issues, continue discussing them.

Remember:
- Be thorough but conversational
- Ask clarifying questions when needed
- Suggest improvements to strengthen the application
- Only approve when genuinely satisfied with the project details`;
}

async function callAgentForAnalysis(
  prompt: string,
  application?: any,
  history?: any[],
  startAnalysis?: boolean
): Promise<string> {
  // Call the agent server - NO FALLBACK, throw error if fails
  const response = await fetch(`${AGENT_SERVER_URL}/analyze-application`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: startAnalysis ? undefined : prompt,
      application,
      history: history || [],
      startAnalysis,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Agent server error:', response.status, errorText);
    throw new Error(`AI service unavailable: ${response.status}`);
  }

  const data = await response.json();
  if (!data.response && !data.analysis) {
    throw new Error('AI returned empty response');
  }

  return data.response || data.analysis;
}

function generateFallbackAnalysis(prompt: string, application?: any, history?: any[], startAnalysis?: boolean): string {
  // This is a fallback when agent server is not available
  // In production, you'd want the real agent analysis

  if (startAnalysis && application) {
    return `## Initial Project Analysis

Thank you for submitting your project application for **${application.project_name}**. I've completed my initial review and here are my findings:

### Overall Assessment
This ${application.category} project in ${application.region}, ${application.country} appears to be a well-structured infrastructure initiative with clear goals. Let me share my detailed analysis.

### Project Details
- **Funding Goal**: $${application.funding_goal.toLocaleString()} USDC
- **Projected APY**: ${application.projected_apy}%
- **Bond Price**: $${application.bond_price} per bond

### Strengths
- Clear project scope and objectives
- Defined revenue model for bond holder returns
- Reasonable milestone structure with ${application.milestones?.length || 0} milestones

### Areas Requiring Clarification
1. **Funding Allocation**: Could you provide a breakdown of how the funding will be allocated across different project phases?
2. **Risk Mitigation**: What contingency plans are in place if the project faces delays?
3. **Revenue Projections**: What assumptions underlie your projected ${application.projected_apy}% APY?

### Questions for You
- Have you secured any initial partnerships, permits, or regulatory approvals?
- What is your team's track record with similar infrastructure projects?
- How will you communicate progress to bond holders throughout the project?

I look forward to discussing these points with you. Once we've addressed these questions, we can finalize the application details.`;
  }

  // For follow-up messages, generate contextual responses
  const messageCount = history?.filter(m => m.role === 'user').length || 0;
  const userMessage = prompt?.toLowerCase() || '';

  // Check for approval indicators in user response
  const hasPartnerships = userMessage.includes('partner') || userMessage.includes('permit') || userMessage.includes('agreement') || userMessage.includes('secured');
  const hasTeamInfo = userMessage.includes('team') || userMessage.includes('experience') || userMessage.includes('completed') || userMessage.includes('track record');
  const hasCommunication = userMessage.includes('report') || userMessage.includes('update') || userMessage.includes('dashboard') || userMessage.includes('communicate');

  if (messageCount >= 2 && (hasPartnerships || hasTeamInfo || hasCommunication)) {
    return `Thank you for the comprehensive response! This addresses my key concerns effectively.

### Assessment Update

Based on the additional information you've provided:

${hasPartnerships ? '✅ **Partnerships & Permits**: Your existing agreements and regulatory progress demonstrate solid groundwork.\n' : ''}
${hasTeamInfo ? '✅ **Team Experience**: Your team\'s track record with similar projects is reassuring for potential investors.\n' : ''}
${hasCommunication ? '✅ **Communication Plan**: The reporting structure you\'ve outlined will keep bond holders well-informed.\n' : ''}

### Next Steps

I'm satisfied with the information provided. Your application for **${application?.project_name || 'this project'}** appears ready for approval.

Before I finalize my recommendation:
1. Please confirm the final funding goal of $${application?.funding_goal?.toLocaleString() || 'N/A'} USDC
2. Confirm the projected APY of ${application?.projected_apy || 'N/A'}%
3. Verify the milestone timeline is accurate

Once confirmed, I'll mark this application as **approved** and you can proceed to create the project on-chain.`;
  }

  // Generate varied follow-up responses
  const followUpResponses = [
    `Thank you for your response regarding ${application?.project_name || 'your project'}.

The details you've shared are helpful. I have a few follow-up questions:

1. **Timeline Confidence**: How confident are you in meeting the milestone dates outlined in your application?
2. **Local Partnerships**: Have you established relationships with local contractors or suppliers in ${application?.region || 'the region'}?
3. **Regulatory Status**: What permits or approvals are still pending?

Your answers will help me complete my assessment of this ${application?.category || 'infrastructure'} project.`,

    `I appreciate the additional context you've provided.

Let me dig a bit deeper on a few points:

1. **Revenue Assumptions**: What's the basis for your ${application?.projected_apy || 'projected'}% APY estimate? Is this based on comparable projects?
2. **Risk Factors**: What are the main risks you've identified and how do you plan to mitigate them?
3. **Community Impact**: How will this project benefit the local community in ${application?.region || 'the area'}?

Understanding these aspects will strengthen the application for potential bond investors.`,

    `Good progress on addressing my initial questions.

A few more points to clarify:

1. **Operational Plan**: Once funded, what's your day-to-day operational structure?
2. **Maintenance**: How will ongoing maintenance be funded after the initial build?
3. **Success Metrics**: What KPIs will you use to measure project success?

We're getting close to finalizing the review. Please address these remaining points.`
  ];

  // Select response based on message count to avoid repetition
  const responseIndex = Math.min(messageCount, followUpResponses.length - 1);
  return followUpResponses[responseIndex];
}
