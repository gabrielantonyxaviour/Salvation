/**
 * Claude Service Client
 * Wrapper for the local claude-code service
 */

import config from '../config.js';

export interface ClaudeResponse {
  response: string;
  sessionId?: string;
}

export class ClaudeClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    // Always use local Claude service for development
    this.baseUrl = 'http://localhost:3002';
    this.apiKey = config.claudeServiceApiKey;
    console.log(`ClaudeClient using: ${this.baseUrl}`);
  }

  /**
   * Send a chat request to Claude service
   */
  async chat(prompt: string, options: {
    model?: 'opus' | 'sonnet';
    sessionId?: string;
    maxTurns?: number;
  } = {}): Promise<ClaudeResponse> {
    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify({
        prompt,
        model: options.model || 'sonnet',
        sessionId: options.sessionId,
        maxTurns: options.maxTurns || 5,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude service error: ${response.status} - ${error}`);
    }

    const data = await response.json() as any;

    // The claude-service returns the response in various formats
    // Handle both direct text and structured responses
    let responseText = '';
    if (typeof data === 'string') {
      responseText = data;
    } else if (data.response) {
      responseText = data.response;
    } else if (data.result) {
      responseText = data.result;
    } else if (data.content) {
      responseText = Array.isArray(data.content)
        ? data.content.map((c: any) => c.text || c).join('')
        : data.content;
    } else {
      responseText = JSON.stringify(data);
    }

    return {
      response: responseText,
      sessionId: data.sessionId,
    };
  }

  /**
   * Analyze an image with Claude Vision
   * Note: Image analysis requires passing URL in the prompt since
   * the local service uses claude-code CLI
   */
  async analyzeImage(imageUrl: string, prompt: string): Promise<string> {
    // Since claude-code CLI can handle image URLs in prompts,
    // we format the request to include the image
    const fullPrompt = `Please analyze this image: ${imageUrl}

${prompt}

Respond with JSON only.`;

    const result = await this.chat(fullPrompt, { model: 'sonnet', maxTurns: 1 });
    return result.response;
  }

  /**
   * Check if Claude service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default ClaudeClient;
