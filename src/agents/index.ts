import { nanoid } from 'nanoid';
import { z } from 'zod';

/**
 * AI Agent Configuration
 */
export const AI_AGENT_CONFIG = {
  DEFAULT_MODEL: 'gpt-4',
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 2000,
  DEFAULT_TIMEOUT: 30000,
  MEMORY_RETENTION_DAYS: 30,
  MAX_CONTEXT_LENGTH: 10000,
};

/**
 * Agent Role
 */
export enum AgentRole {
  COORDINATOR = 'coordinator',
  RESEARCHER = 'researcher',
  WRITER = 'writer',
  CODER = 'coder',
  ANALYST = 'analyst',
  REVIEWER = 'reviewer',
  EXECUTOR = 'executor',
}

/**
 * Agent Status
 */
export enum AgentStatus {
  IDLE = 'idle',
  THINKING = 'thinking',
  WORKING = 'working',
  WAITING = 'waiting',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Agent Message
 */
export interface AgentMessage {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Agent Memory
 */
export interface AgentMemory {
  id: string;
  type: 'episodic' | 'semantic' | 'working';
  content: unknown;
  timestamp: Date;
  importance: number;
  accessCount: number;
  lastAccessed: Date;
  tags: string[];
}

/**
 * Agent Tool
 */
export interface AgentTool {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  handler: (input: unknown) => Promise<unknown>;
  enabled: boolean;
}

/**
 * Agent Task
 */
export interface AgentTask {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedTo?: string;
  result?: unknown;
  error?: string;
  startTime?: Date;
  endTime?: Date;
  dependencies: string[];
}

/**
 * AI Agent
 */
export class AIAgent {
  private id: string;
  private name: string;
  private role: AgentRole;
  private status: AgentStatus;
  private messages: AgentMessage[];
  private memory: AgentMemory[];
  private tools: Map<string, AgentTool>;
  private currentTask: AgentTask | null;
  private capabilities: string[];

  constructor(
    name: string,
    role: AgentRole,
    capabilities: string[] = []
  ) {
    this.id = nanoid();
    this.name = name;
    this.role = role;
    this.status = AgentStatus.IDLE;
    this.messages = [];
    this.memory = [];
    this.tools = new Map();
    this.currentTask = null;
    this.capabilities = capabilities;
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getRole(): AgentRole {
    return this.role;
  }

  getStatus(): AgentStatus {
    return this.status;
  }

  setStatus(status: AgentStatus): void {
    this.status = status;
  }

  getCapabilities(): string[] {
    return this.capabilities;
  }

  addMessage(message: Omit<AgentMessage, 'id' | 'timestamp'>): void {
    this.messages.push({
      ...message,
      id: nanoid(),
      timestamp: new Date(),
    });
  }

  getMessages(limit?: number): AgentMessage[] {
    if (limit) {
      return this.messages.slice(-limit);
    }
    return this.messages;
  }

  clearMessages(): void {
    this.messages = [];
  }

  addMemory(
    type: AgentMemory['type'],
    content: unknown,
    importance: number = 0.5,
    tags: string[] = []
  ): void {
    const memory: AgentMemory = {
      id: nanoid(),
      type,
      content,
      timestamp: new Date(),
      importance,
      accessCount: 0,
      lastAccessed: new Date(),
      tags,
    };
    this.memory.push(memory);
    this.pruneMemory();
  }

  getMemory(type?: AgentMemory['type'], limit?: number): AgentMemory[] {
    let filtered = type ? this.memory.filter((m) => m.type === type) : this.memory;

    // Sort by importance and recency
    filtered.sort((a, b) => {
      const importanceDiff = b.importance - a.importance;
      if (importanceDiff !== 0) return importanceDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    // Update access count and last accessed
    filtered.forEach((m) => {
      m.accessCount++;
      m.lastAccessed = new Date();
    });

    return limit ? filtered.slice(0, limit) : filtered;
  }

  private pruneMemory(): void {
    const retentionDate = new Date();
    retentionDate.setDate(
      retentionDate.getDate() - AI_AGENT_CONFIG.MEMORY_RETENTION_DAYS
    );

    this.memory = this.memory.filter(
      (m) => m.timestamp > retentionDate && m.importance > 0.1
    );

    // Limit memory size
    if (this.memory.length > 1000) {
      this.memory = this.memory.slice(0, 1000);
    }
  }

  registerTool(tool: Omit<AgentTool, 'enabled'>): void {
    this.tools.set(tool.name, { ...tool, enabled: true });
  }

  unregisterTool(name: string): void {
    this.tools.delete(name);
  }

  getTool(name: string): AgentTool | undefined {
    return this.tools.get(name);
  }

  listTools(): AgentTool[] {
    return Array.from(this.tools.values());
  }

  async executeTool(name: string, input: unknown): Promise<unknown> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    if (!tool.enabled) {
      throw new Error(`Tool not enabled: ${name}`);
    }

    try {
      const validated = tool.inputSchema.safeParse(input);
      if (!validated.success) {
        throw new Error(`Invalid input for tool ${name}: ${validated.error.message}`);
      }

      const result = await tool.handler(validated.data);
      return result;
    } catch (error) {
      throw new Error(`Tool execution failed: ${name} - ${(error as Error).message}`);
    }
  }

  assignTask(task: AgentTask): void {
    this.currentTask = task;
    this.setStatus(AgentStatus.WORKING);
    task.assignedTo = this.id;
    task.startTime = new Date();
  }

  completeTask(result?: unknown): void {
    if (this.currentTask) {
      this.currentTask.status = 'completed';
      this.currentTask.result = result;
      this.currentTask.endTime = new Date();
      this.currentTask = null;
    }
    this.setStatus(AgentStatus.COMPLETED);
  }

  failTask(error: string): void {
    if (this.currentTask) {
      this.currentTask.status = 'failed';
      this.currentTask.error = error;
      this.currentTask.endTime = new Date();
      this.currentTask = null;
    }
    this.setStatus(AgentStatus.FAILED);
  }

  getCurrentTask(): AgentTask | null {
    return this.currentTask;
  }

  async think(prompt: string): Promise<string> {
    this.setStatus(AgentStatus.THINKING);
    this.addMessage({ role: 'user', content: prompt });

    // In production, this would call an LLM API
    // For now, return a placeholder
    const response = await this.generateResponse(prompt);
    this.addMessage({ role: 'assistant', content: response });
    this.setStatus(AgentStatus.IDLE);

    return response;
  }

  private async generateResponse(prompt: string): Promise<string> {
    // LLM API call implementation
    // For now, return a placeholder
    return `Response to: ${prompt}`;
  }

  async reflect(): Promise<string> {
    const recentMessages = this.getMessages(10);
    const recentMemory = this.getMemory('working', 5);

    const reflectionPrompt = `
Recent messages:
${recentMessages.map((m) => `${m.role}: ${m.content}`).join('\n')}

Recent memory:
${recentMemory.map((m) => `- ${JSON.stringify(m.content)}`).join('\n')}

Reflect on your recent work and identify areas for improvement.
    `;

    return await this.think(reflectionPrompt);
  }

  toObject(): unknown {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      status: this.status,
      capabilities: this.capabilities,
      currentTask: this.currentTask,
      messageCount: this.messages.length,
      memoryCount: this.memory.length,
      toolCount: this.tools.size,
    };
  }
}

/**
 * Agent Crew
 * Manages a team of AI agents
 */
export class AgentCrew {
  private agents: Map<string, AIAgent> = new Map();
  private tasks: Map<string, AgentTask> = new Map();
  private taskQueue: AgentTask[] = [];
  private active: boolean = false;

  constructor() {
    this.setupDefaultAgents();
  }

  private setupDefaultAgents(): void {
    // Coordinator agent
    const coordinator = new AIAgent('Coordinator', AgentRole.COORDINATOR, [
      'task_assignment',
      'coordination',
      'planning',
      'monitoring',
    ]);
    this.addAgent(coordinator);

    // Researcher agent
    const researcher = new AIAgent('Researcher', AgentRole.RESEARCHER, [
      'web_search',
      'data_analysis',
      'information_synthesis',
      'fact_checking',
    ]);
    this.addAgent(researcher);

    // Writer agent
    const writer = new AIAgent('Writer', AgentRole.WRITER, [
      'content_creation',
      'documentation',
      'editing',
      'formatting',
    ]);
    this.addAgent(writer);

    // Coder agent
    const coder = new AIAgent('Coder', AgentRole.CODER, [
      'code_generation',
      'code_review',
      'debugging',
      'refactoring',
    ]);
    this.addAgent(coder);

    // Analyst agent
    const analyst = new AIAgent('Analyst', AgentRole.ANALYST, [
      'data_analysis',
      'pattern_recognition',
      'trend_analysis',
      'reporting',
    ]);
    this.addAgent(analyst);

    // Executor agent
    const executor = new AIAgent('Executor', AgentRole.EXECUTOR, [
      'task_execution',
      'automation',
      'system_operations',
      'file_operations',
    ]);
    this.addAgent(executor);
  }

  addAgent(agent: AIAgent): void {
    this.agents.set(agent.getId(), agent);
  }

  removeAgent(agentId: string): void {
    this.agents.delete(agentId);
  }

  getAgent(agentId: string): AIAgent | undefined {
    return this.agents.get(agentId);
  }

  getAgentsByRole(role: AgentRole): AIAgent[] {
    return Array.from(this.agents.values()).filter((agent) => agent.getRole() === role);
  }

  getAgentByCapability(capability: string): AIAgent[] {
    return Array.from(this.agents.values()).filter((agent) =>
      agent.getCapabilities().includes(capability)
    );
  }

  getAllAgents(): AIAgent[] {
    return Array.from(this.agents.values());
  }

  addTask(task: AgentTask): void {
    this.tasks.set(task.id, task);
    this.taskQueue.push(task);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (!this.active || this.taskQueue.length === 0) {
      return;
    }

    const task = this.taskQueue.shift();
    if (!task) return;

    // Check if dependencies are met
    const dependencies = task.dependencies
      .map((id) => this.tasks.get(id))
      .filter((t) => t && t.status !== 'completed');

    if (dependencies.length > 0) {
      // Requeue task
      this.taskQueue.push(task);
      return;
    }

    // Find suitable agent
    const agent = this.findAgentForTask(task);
    if (!agent) {
      task.status = 'failed';
      task.error = 'No suitable agent found';
      return;
    }

    // Assign task to agent
    agent.assignTask(task);

    try {
      // Execute task
      await this.executeTask(agent, task);
      agent.completeTask();
    } catch (error) {
      agent.failTask((error as Error).message);
    }

    // Continue processing queue
    this.processQueue();
  }

  private findAgentForTask(task: AgentTask): AIAgent | undefined {
    // Simple task assignment logic
    // In production, this would be more sophisticated
    const availableAgents = this.getAllAgents().filter(
      (agent) => agent.getStatus() === AgentStatus.IDLE
    );

    if (availableAgents.length === 0) {
      return undefined;
    }

    // Return first available agent
    return availableAgents[0];
  }

  private async executeTask(agent: AIAgent, task: AgentTask): Promise<unknown> {
    // Task execution logic
    // In production, this would call the agent's think method
    const result = await agent.think(task.description);
    return result;
  }

  getTask(taskId: string): AgentTask | undefined {
    return this.tasks.get(taskId);
  }

  getAllTasks(): AgentTask[] {
    return Array.from(this.tasks.values());
  }

  start(): void {
    this.active = true;
    this.processQueue();
  }

  stop(): void {
    this.active = false;
  }

  async collaborate(prompt: string): Promise<string> {
    const coordinator = this.getAgentsByRole(AgentRole.COORDINATOR)[0];
    if (!coordinator) {
      throw new Error('Coordinator agent not found');
    }

    const response = await coordinator.think(prompt);
    return response;
  }

  getStatus(): unknown {
    return {
      active: this.active,
      agentCount: this.agents.size,
      taskCount: this.tasks.size,
      queueLength: this.taskQueue.length,
      agents: this.getAllAgents().map((agent) => agent.toObject()),
      tasks: this.getAllTasks(),
    };
  }
}

/**
 * Memory System
 * Advanced memory management for agents
 */
export class MemorySystem {
  private shortTerm: Map<string, unknown> = new Map();
  private longTerm: Map<string, AgentMemory> = new Map();
  private episodic: AgentMemory[] = [];
  private semantic: AgentMemory[] = [];

  storeShortTerm(key: string, value: unknown): void {
    this.shortTerm.set(key, value);
  }

  retrieveShortTerm(key: string): unknown {
    return this.shortTerm.get(key);
  }

  clearShortTerm(): void {
    this.shortTerm.clear();
  }

  storeLongTerm(key: string, memory: Omit<AgentMemory, 'id' | 'timestamp' | 'accessCount' | 'lastAccessed'>): void {
    const storedMemory: AgentMemory = {
      ...memory,
      id: nanoid(),
      timestamp: new Date(),
      accessCount: 0,
      lastAccessed: new Date(),
    };
    this.longTerm.set(key, storedMemory);
  }

  retrieveLongTerm(key: string): AgentMemory | undefined {
    const memory = this.longTerm.get(key);
    if (memory) {
      memory.accessCount++;
      memory.lastAccessed = new Date();
    }
    return memory;
  }

  addEpisodicMemory(content: unknown, importance: number = 0.5, tags: string[] = []): void {
    const memory: AgentMemory = {
      id: nanoid(),
      type: 'episodic',
      content,
      timestamp: new Date(),
      importance,
      accessCount: 0,
      lastAccessed: new Date(),
      tags,
    };
    this.episodic.push(memory);
    this.pruneEpisodicMemory();
  }

  addSemanticMemory(content: unknown, importance: number = 0.7, tags: string[] = []): void {
    const memory: AgentMemory = {
      id: nanoid(),
      type: 'semantic',
      content,
      timestamp: new Date(),
      importance,
      accessCount: 0,
      lastAccessed: new Date(),
      tags,
    };
    this.semantic.push(memory);
    this.pruneSemanticMemory();
  }

  retrieveEpisodicMemory(query: string, limit: number = 5): AgentMemory[] {
    // Simple retrieval based on tags and content matching
    // In production, this would use vector embeddings and similarity search
    const queryLower = query.toLowerCase();
    const filtered = this.episodic.filter((memory) => {
      const content = JSON.stringify(memory.content).toLowerCase();
      const tags = memory.tags.join(' ').toLowerCase();
      return content.includes(queryLower) || tags.includes(queryLower);
    });

    // Sort by importance and recency
    filtered.sort((a, b) => {
      const importanceDiff = b.importance - a.importance;
      if (importanceDiff !== 0) return importanceDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    return limit ? filtered.slice(0, limit) : filtered;
  }

  retrieveSemanticMemory(query: string, limit: number = 5): AgentMemory[] {
    // Similar to episodic retrieval
    return this.retrieveEpisodicMemory(query, limit);
  }

  private pruneEpisodicMemory(): void {
    const retentionDate = new Date();
    retentionDate.setDate(
      retentionDate.getDate() - AI_AGENT_CONFIG.MEMORY_RETENTION_DAYS
    );

    this.episodic = this.episodic.filter(
      (m) => m.timestamp > retentionDate && m.importance > 0.1
    );

    if (this.episodic.length > 500) {
      this.episodic = this.episodic.slice(0, 500);
    }
  }

  private pruneSemanticMemory(): void {
    const retentionDate = new Date();
    retentionDate.setDate(
      retentionDate.getDate() - AI_AGENT_CONFIG.MEMORY_RETENTION_DAYS
    );

    this.semantic = this.semantic.filter(
      (m) => m.timestamp > retentionDate && m.importance > 0.1
    );

    if (this.semantic.length > 1000) {
      this.semantic = this.semantic.slice(0, 1000);
    }
  }

  consolidate(): void {
    // Move frequently accessed episodic memories to semantic memory
    const threshold = 10;
    for (const memory of this.episodic) {
      if (memory.accessCount >= threshold && memory.importance > 0.7) {
        this.addSemanticMemory(memory.content, memory.importance, memory.tags);
      }
    }
  }

  getStatus(): unknown {
    return {
      shortTermCount: this.shortTerm.size,
      longTermCount: this.longTerm.size,
      episodicCount: this.episodic.length,
      semanticCount: this.semantic.length,
    };
  }
}

/**
 * Agent Orchestration
 * High-level orchestration of agent operations
 */
export class AgentOrchestration {
  private crew: AgentCrew;
  private memory: MemorySystem;

  constructor() {
    this.crew = new AgentCrew();
    this.memory = new MemorySystem();
  }

  getCrew(): AgentCrew {
    return this.crew;
  }

  getMemory(): MemorySystem {
    return this.memory;
  }

  async executeWorkflow(workflow: AgentWorkflow): Promise<WorkflowResult> {
    const result: WorkflowResult = {
      workflowId: workflow.id,
      status: 'running',
      steps: [],
      startTime: new Date(),
    };

    try {
      for (const step of workflow.steps) {
        const stepResult = await this.executeStep(step);
        result.steps.push(stepResult);

        if (!stepResult.success) {
          throw new Error(`Step failed: ${step.name}`);
        }
      }

      result.status = 'completed';
      result.endTime = new Date();
    } catch (error) {
      result.status = 'failed';
      result.error = (error as Error).message;
      result.endTime = new Date();
    }

    return result;
  }

  private async executeStep(step: WorkflowStep): Promise<StepResult> {
    const result: StepResult = {
      stepId: step.id,
      name: step.name,
      success: false,
      startTime: new Date(),
    };

    try {
      // Find suitable agent for the step
      const agent = this.findAgentForStep(step);
      if (!agent) {
        throw new Error(`No suitable agent for step: ${step.name}`);
      }

      // Execute the step
      const task: AgentTask = {
        id: nanoid(),
        description: step.description,
        status: 'in_progress',
        dependencies: [],
      };

      agent.assignTask(task);

      // Add to crew task queue
      this.crew.addTask(task);

      // Wait for task completion
      await this.waitForTaskCompletion(task.id);

      result.success = true;
      result.endTime = new Date();
    } catch (error) {
      result.error = (error as Error).message;
      result.endTime = new Date();
    }

    return result;
  }

  private findAgentForStep(step: WorkflowStep): AIAgent | undefined {
    // Simple agent selection logic
    // In production, this would use more sophisticated matching
    const agent = this.crew.getAgentByCapability(step.requiredCapability);
    return agent[0];
  }

  private async waitForTaskCompletion(taskId: string): Promise<void> {
    // Poll for task completion
    // In production, this would use events/promises
    const maxAttempts = 60;
    const interval = 1000;

    for (let i = 0; i < maxAttempts; i++) {
      const task = this.crew.getTask(taskId);
      if (task && (task.status === 'completed' || task.status === 'failed')) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error('Task timeout');
  }

  getStatus(): unknown {
    return {
      crew: this.crew.getStatus(),
      memory: this.memory.getStatus(),
    };
  }
}

/**
 * Workflow Step
 */
export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  requiredCapability: string;
  dependencies: string[];
}

/**
 * Agent Workflow
 */
export interface AgentWorkflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
}

/**
 * Step Result
 */
export interface StepResult {
  stepId: string;
  name: string;
  success: boolean;
  startTime: Date;
  endTime?: Date;
  error?: string;
  output?: unknown;
}

/**
 * Workflow Result
 */
export interface WorkflowResult {
  workflowId: string;
  status: 'running' | 'completed' | 'failed';
  steps: StepResult[];
  startTime: Date;
  endTime?: Date;
  error?: string;
}
