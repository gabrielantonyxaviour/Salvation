/**
 * Base Agent Class for Salvation
 *
 * Provides common functionality for all verification agents:
 * - Agent-to-agent communication via A2A protocol
 * - Message handling
 * - Task processing
 */

export interface AgentConfig {
  name: string;
  description: string;
  capabilities: string[];
  version?: string;
}

export abstract class BaseAgent {
  protected name: string;
  protected description: string;
  protected capabilities: string[];
  protected version: string;

  constructor(config: AgentConfig) {
    this.name = config.name;
    this.description = config.description;
    this.capabilities = config.capabilities;
    this.version = config.version || '1.0.0';

    console.log(`🤖 ${this.name} initialized`);
    console.log(`   Capabilities: ${this.capabilities.join(', ')}`);
  }

  /**
   * Get agent info
   */
  getAgentInfo() {
    return {
      name: this.name,
      description: this.description,
      capabilities: this.capabilities,
      version: this.version,
    };
  }

  /**
   * Process agent-specific analysis/work
   * Must be implemented by subclasses
   */
  abstract processTask(input: any): Promise<any>;

  /**
   * Get agent's current analysis or state
   */
  abstract getCurrentAnalysis(): any;

  /**
   * Cleanup resources
   */
  cleanup(): void {
    console.log(`🧹 ${this.name} cleaning up`);
  }
}
