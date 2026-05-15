import { nanoid } from 'nanoid';
import { z } from 'zod';

/**
 * Workflow Configuration
 */
export const WORKFLOW_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  TIMEOUT_MS: 300000, // 5 minutes
  MAX_PARALLEL_STEPS: 5,
  FALLBACK_ENABLED: true,
  CIRCUIT_BREAKER_THRESHOLD: 5,
  CIRCUIT_BREAKER_RESET_MS: 60000,
};

/**
 * Workflow Status
 */
export enum WorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused',
}

/**
 * Step Status
 */
export enum StepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  RETRYING = 'retrying',
}

/**
 * Step Definition
 */
export interface StepDefinition {
  id: string;
  name: string;
  description: string;
  handler: (context: WorkflowContext) => Promise<StepResult>;
  dependencies: string[];
  timeout?: number;
  retries?: number;
  fallback?: StepDefinition;
  conditions?: StepCondition[];
  parallelizable?: boolean;
}

/**
 * Step Condition
 */
export interface StepCondition {
  type: 'if' | 'unless' | 'assert';
  expression: string;
  message?: string;
}

/**
 * Workflow Context
 */
export class WorkflowContext {
  private data: Map<string, unknown> = new Map();
  private metadata: Map<string, unknown> = new Map();
  private workflowId: string;
  private executionId: string;

  constructor(workflowId: string) {
    this.workflowId = workflowId;
    this.executionId = nanoid();
  }

  getWorkflowId(): string {
    return this.workflowId;
  }

  getExecutionId(): string {
    return this.executionId;
  }

  setData(key: string, value: unknown): void {
    this.data.set(key, value);
  }

  getData(key: string): unknown {
    return this.data.get(key);
  }

  getAllData(): Map<string, unknown> {
    return new Map(this.data);
  }

  setMetadata(key: string, value: unknown): void {
    this.metadata.set(key, value);
  }

  getMetadata(key: string): unknown {
    return this.metadata.get(key);
  }

  getAllMetadata(): Map<string, unknown> {
    return new Map(this.metadata);
  }

  clone(): WorkflowContext {
    const cloned = new WorkflowContext(this.workflowId);
    cloned.data = new Map(this.data);
    cloned.metadata = new Map(this.metadata);
    return cloned;
  }
}

/**
 * Step Result
 */
export interface StepResult {
  stepId: string;
  status: StepStatus;
  output?: unknown;
  error?: string;
  duration?: number;
  retryCount?: number;
  startTime: Date;
  endTime?: Date;
}

/**
 * Workflow Execution
 */
export class WorkflowExecution {
  private workflowId: string;
  private executionId: string;
  private status: WorkflowStatus;
  private steps: Map<string, StepResult> = new Map();
  private context: WorkflowContext;
  private startTime: Date;
  private endTime?: Date;
  private error?: string;

  constructor(workflowId: string, context: WorkflowContext) {
    this.workflowId = workflowId;
    this.executionId = context.getExecutionId();
    this.status = WorkflowStatus.PENDING;
    this.context = context;
    this.startTime = new Date();
  }

  getWorkflowId(): string {
    return this.workflowId;
  }

  getExecutionId(): string {
    return this.executionId;
  }

  getStatus(): WorkflowStatus {
    return this.status;
  }

  setStatus(status: WorkflowStatus): void {
    this.status = status;
  }

  getContext(): WorkflowContext {
    return this.context;
  }

  setStepResult(stepId: string, result: StepResult): void {
    this.steps.set(stepId, result);
  }

  getStepResult(stepId: string): StepResult | undefined {
    return this.steps.get(stepId);
  }

  getAllStepResults(): StepResult[] {
    return Array.from(this.steps.values());
  }

  getStartTime(): Date {
    return this.startTime;
  }

  getEndTime(): Date | undefined {
    return this.endTime;
  }

  setEndTime(endTime: Date): void {
    this.endTime = endTime;
  }

  setError(error: string): void {
    this.error = error;
  }

  getError(): string | undefined {
    return this.error;
  }

  getDuration(): number {
    const end = this.endTime || new Date();
    return end.getTime() - this.startTime.getTime();
  }

  toObject(): unknown {
    return {
      workflowId: this.workflowId,
      executionId: this.executionId,
      status: this.status,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.getDuration(),
      error: this.error,
      steps: Array.from(this.steps.entries()).map(([id, result]) => ({ id, ...result })),
      context: {
        data: Array.from(this.context.getAllData().entries()),
        metadata: Array.from(this.context.getAllMetadata().entries()),
      },
    };
  }
}

/**
 * Circuit Breaker
 * Prevents cascading failures
 */
export class CircuitBreaker {
  private failureCount: number = 0;
  private lastFailureTime?: Date;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private threshold: number;
  private resetTimeout: number;

  constructor(threshold: number = WORKFLOW_CONFIG.CIRCUIT_BREAKER_THRESHOLD, resetTimeout: number = WORKFLOW_CONFIG.CIRCUIT_BREAKER_RESET_MS) {
    this.threshold = threshold;
    this.resetTimeout = resetTimeout;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.failureCount >= this.threshold) {
      this.state = 'open';
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    const elapsed = Date.now() - this.lastFailureTime.getTime();
    return elapsed > this.resetTimeout;
  }

  getState(): string {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }
}

/**
 * Retry Strategy
 */
export class RetryStrategy {
  private maxRetries: number;
  private delayMs: number;
  private backoffMultiplier: number;
  private maxDelayMs: number;

  constructor(
    maxRetries: number = WORKFLOW_CONFIG.MAX_RETRIES,
    delayMs: number = WORKFLOW_CONFIG.RETRY_DELAY_MS,
    backoffMultiplier: number = 2,
    maxDelayMs: number = 60000
  ) {
    this.maxRetries = maxRetries;
    this.delayMs = delayMs;
    this.backoffMultiplier = backoffMultiplier;
    this.maxDelayMs = maxDelayMs;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt < this.maxRetries) {
          const delay = this.calculateDelay(attempt);
          await this.delay(delay);
        }
      }
    }

    throw lastError || new Error('Retry strategy failed');
  }

  private calculateDelay(attempt: number): number {
    const delay = this.delayMs * Math.pow(this.backoffMultiplier, attempt);
    return Math.min(delay, this.maxDelayMs);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Workflow Engine
 * Executes workflows with fallbacks and retries
 */
export class WorkflowEngine {
  private workflows: Map<string, StepDefinition[]> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private retryStrategies: Map<string, RetryStrategy> = new Map();

  registerWorkflow(id: string, steps: StepDefinition[]): void {
    this.workflows.set(id, steps);
  }

  unregisterWorkflow(id: string): void {
    this.workflows.delete(id);
  }

  getWorkflow(id: string): StepDefinition[] | undefined {
    return this.workflows.get(id);
  }

  async execute(workflowId: string, context?: WorkflowContext): Promise<WorkflowExecution> {
    const steps = this.getWorkflow(workflowId);
    if (!steps) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const executionContext = context || new WorkflowContext(workflowId);
    const execution = new WorkflowExecution(workflowId, executionContext);
    this.executions.set(execution.getExecutionId(), execution);

    execution.setStatus(WorkflowStatus.RUNNING);

    try {
      await this.executeSteps(steps, execution);
      execution.setStatus(WorkflowStatus.COMPLETED);
      execution.setEndTime(new Date());
    } catch (error) {
      execution.setStatus(WorkflowStatus.FAILED);
      execution.setError((error as Error).message);
      execution.setEndTime(new Date());
    }

    return execution;
  }

  private async executeSteps(
    steps: StepDefinition[],
    execution: WorkflowExecution
  ): Promise<void> {
    const completedSteps = new Set<string>();
    const runningSteps = new Set<string>();

    const executeStep = async (step: StepDefinition): Promise<void> => {
      if (completedSteps.has(step.id)) {
        return;
      }

      // Check dependencies
      for (const depId of step.dependencies) {
        if (!completedSteps.has(depId)) {
          // Wait for dependency to complete
          await new Promise((resolve) => setTimeout(resolve, 100));
          if (!completedSteps.has(depId)) {
            throw new Error(`Dependency not completed: ${depId}`);
          }
        }
      }

      // Check conditions
      if (step.conditions) {
        const conditionMet = this.evaluateConditions(step.conditions, execution.getContext());
        if (!conditionMet) {
          execution.setStepResult(step.id, {
            stepId: step.id,
            status: StepStatus.SKIPPED,
            startTime: new Date(),
            endTime: new Date(),
          });
          completedSteps.add(step.id);
          return;
        }
      }

      // Execute step
      const stepResult = await this.executeStepWithRetry(step, execution);
      execution.setStepResult(step.id, stepResult);

      if (stepResult.status === StepStatus.FAILED) {
        throw new Error(`Step failed: ${step.name} - ${stepResult.error}`);
      }

      completedSteps.add(step.id);
    };

    // Execute steps in parallel where possible
    const parallelSteps = steps.filter((s) => s.parallelizable && s.dependencies.every((d) => completedSteps.has(d)));
    const sequentialSteps = steps.filter((s) => !s.parallelizable);

    // Execute parallel steps
    const parallelPromises = parallelSteps.map((step) => executeStep(step));
    await Promise.all(parallelPromises);

    // Execute sequential steps
    for (const step of sequentialSteps) {
      await executeStep(step);
    }
  }

  private async executeStepWithRetry(
    step: StepDefinition,
    execution: WorkflowExecution
  ): Promise<StepResult> {
    const stepId = step.id;
    const timeout = step.timeout || WORKFLOW_CONFIG.TIMEOUT_MS;
    const retries = step.retries !== undefined ? step.retries : WORKFLOW_CONFIG.MAX_RETRIES;

    const result: StepResult = {
      stepId,
      status: StepStatus.RUNNING,
      startTime: new Date(),
    };

    const executeWithTimeout = async (): Promise<StepResult> => {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Step timeout')), timeout)
      );

      try {
        const stepPromise = step.handler(execution.getContext());
        const output = await Promise.race([stepPromise, timeoutPromise]);
        return {
          stepId,
          status: StepStatus.COMPLETED,
          output,
          startTime: result.startTime,
          endTime: new Date(),
          duration: Date.now() - result.startTime.getTime(),
        };
      } catch (error) {
        return {
          stepId,
          status: StepStatus.FAILED,
          error: (error as Error).message,
          startTime: result.startTime,
          endTime: new Date(),
          duration: Date.now() - result.startTime.getTime(),
        };
      }
    };

    const retryStrategy = new RetryStrategy(retries);
    const circuitBreaker = this.getCircuitBreaker(stepId);

    try {
      return await circuitBreaker.execute(() => retryStrategy.execute(executeWithTimeout));
    } catch (error) {
      // Try fallback if available
      if (WORKFLOW_CONFIG.FALLBACK_ENABLED && step.fallback) {
        execution.getContext().setMetadata('fallback_triggered', true);
        return await this.executeStepWithRetry(step.fallback, execution);
      }

      return {
        stepId,
        status: StepStatus.FAILED,
        error: (error as Error).message,
        startTime: result.startTime,
        endTime: new Date(),
        duration: Date.now() - result.startTime.getTime(),
      };
    }
  }

  private evaluateConditions(conditions: StepCondition[], context: WorkflowContext): boolean {
    // Simple condition evaluation
    // In production, this would use a proper expression parser
    for (const condition of conditions) {
      const conditionMet = this.evaluateCondition(condition, context);
      if (condition.type === 'if' && !conditionMet) {
        return false;
      }
      if (condition.type === 'unless' && conditionMet) {
        return false;
      }
      if (condition.type === 'assert' && !conditionMet) {
        throw new Error(condition.message || 'Condition assertion failed');
      }
    }
    return true;
  }

  private evaluateCondition(condition: StepCondition, context: WorkflowContext): boolean {
    // Simple condition evaluation
    // In production, this would use a proper expression parser
    try {
      const data = context.getAllData();
      const metadata = context.getAllMetadata();

      // Replace variables in expression
      let expression = condition.expression;
      for (const [key, value] of data.entries()) {
        expression = expression.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), String(value));
      }

      // Evaluate expression
      return this.safeEval(expression);
    } catch {
      return false;
    }
  }

  private safeEval(expression: string): boolean {
    // Safe expression evaluation
    // In production, this would use a proper sandbox
    try {
      // Very basic evaluation - just check if it's "true" or "false"
      return expression.toLowerCase() === 'true';
    } catch {
      return false;
    }
  }

  getCircuitBreaker(stepId: string): CircuitBreaker {
    let breaker = this.circuitBreakers.get(stepId);
    if (!breaker) {
      breaker = new CircuitBreaker();
      this.circuitBreakers.set(stepId, breaker);
    }
    return breaker;
  }

  getRetryStrategy(stepId: string): RetryStrategy {
    let strategy = this.retryStrategies.get(stepId);
    if (!strategy) {
      strategy = new RetryStrategy();
      this.retryStrategies.set(stepId, strategy);
    }
    return strategy;
  }

  cancelExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (execution && execution.getStatus() === WorkflowStatus.RUNNING) {
      execution.setStatus(WorkflowStatus.CANCELLED);
      execution.setEndTime(new Date());
      return true;
    }
    return false;
  }

  pauseExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (execution && execution.getStatus() === WorkflowStatus.RUNNING) {
      execution.setStatus(WorkflowStatus.PAUSED);
      return true;
    }
    return false;
  }

  resumeExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (execution && execution.getStatus() === WorkflowStatus.PAUSED) {
      execution.setStatus(WorkflowStatus.RUNNING);
      return true;
    }
    return false;
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  getAllExecutions(workflowId?: string): WorkflowExecution[] {
    const executions = Array.from(this.executions.values());
    if (workflowId) {
      return executions.filter((e) => e.getWorkflowId() === workflowId);
    }
    return executions;
  }

  getStatus(): unknown {
    return {
      workflowCount: this.workflows.size,
      executionCount: this.executions.size,
      circuitBreakerCount: this.circuitBreakers.size,
      retryStrategyCount: this.retryStrategies.size,
    };
  }
}

/**
 * Workflow Builder
 * Builder pattern for creating workflows
 */
export class WorkflowBuilder {
  private workflowId: string;
  private steps: StepDefinition[] = [];

  constructor(workflowId: string) {
    this.workflowId = workflowId;
  }

  addStep(step: Omit<StepDefinition, 'id'>): WorkflowBuilder {
    this.steps.push({
      ...step,
      id: nanoid(),
    });
    return this;
  }

  addSteps(steps: Omit<StepDefinition, 'id'>[]): WorkflowBuilder {
    steps.forEach((step) => this.addStep(step));
    return this;
  }

  build(): StepDefinition[] {
    return this.steps;
  }
}

/**
 * Fallback Strategy
 */
export class FallbackStrategy {
  private fallbacks: Map<string, StepDefinition> = new Map();

  registerFallback(stepId: string, fallback: StepDefinition): void {
    this.fallbacks.set(stepId, fallback);
  }

  getFallback(stepId: string): StepDefinition | undefined {
    return this.fallbacks.get(stepId);
  }

  hasFallback(stepId: string): boolean {
    return this.fallbacks.has(stepId);
  }
}
