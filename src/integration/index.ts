/**
 * System Integration Layer
 */

import { MiddlewareManager, defaultMiddlewareConfig } from '../middleware';
import { ApiRouter, HealthCheckService, ApiClient } from '../api';
import { MCPServer, MCPClient } from '../mcp';
import { getTracingManager, trace } from '../tracing';
import { AgentCrew, AgentOrchestration, MemorySystem } from '../agents';
import { WorkflowEngine, WorkflowBuilder } from '../workflows';
import { getUptimeMonitor, getHealthDashboard } from '../monitoring';

/**
 * System Configuration
 */
export const SYSTEM_CONFIG = {
  name: 'tolaria-automation',
  version: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  debug: process.env.DEBUG === 'true',
};

/**
 * System Manager
 * Central coordinator for all system components
 */
export class SystemManager {
  private static instance: SystemManager;
  private middleware!: MiddlewareManager;
  private apiRouter!: ApiRouter;
  private mcpServer!: MCPServer;
  private tracingManager!: ReturnType<typeof getTracingManager>;
  private agentCrew!: AgentCrew;
  private agentOrchestration!: AgentOrchestration;
  private memorySystem!: MemorySystem;
  private workflowEngine!: WorkflowEngine;
  private uptimeMonitor!: ReturnType<typeof getUptimeMonitor>;
  private healthDashboard!: ReturnType<typeof getHealthDashboard>;
  private initialized: boolean = false;

  private constructor() {
    this.initializeComponents();
  }

  static getInstance(): SystemManager {
    if (!SystemManager.instance) {
      SystemManager.instance = new SystemManager();
    }
    return SystemManager.instance;
  }

  private initializeComponents(): void {
    // Initialize middleware
    this.middleware = new MiddlewareManager(defaultMiddlewareConfig);

    // Initialize API router
    this.apiRouter = new ApiRouter(this.middleware);
    const healthCheckService = new HealthCheckService(this.middleware);
    this.apiRouter = healthCheckService.getRouter();

    // Initialize MCP server
    this.mcpServer = new MCPServer();

    // Initialize tracing
    this.tracingManager = getTracingManager();

    // Initialize AI agents
    this.agentCrew = new AgentCrew();
    this.memorySystem = new MemorySystem();
    this.agentOrchestration = new AgentOrchestration();

    // Initialize workflow engine
    this.workflowEngine = new WorkflowEngine();

    // Initialize monitoring
    this.uptimeMonitor = getUptimeMonitor();
    this.healthDashboard = getHealthDashboard();
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize MCP server
      await this.mcpServer.initialize();

      // Start uptime monitoring
      this.uptimeMonitor.startMonitoring();

      // Start agent crew
      this.agentCrew.start();

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize system:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      // Stop uptime monitoring
      this.uptimeMonitor.stopMonitoring();

      // Stop agent crew
      this.agentCrew.stop();

      // Shutdown tracing
      await this.tracingManager.shutdown();

      this.initialized = false;
    } catch (error) {
      console.error('Failed to shutdown system:', error);
      throw error;
    }
  }

  getMiddleware(): MiddlewareManager {
    return this.middleware;
  }

  getApiRouter(): ApiRouter {
    return this.apiRouter;
  }

  getMcpServer(): MCPServer {
    return this.mcpServer;
  }

  getTracingManager(): ReturnType<typeof getTracingManager> {
    return this.tracingManager;
  }

  getAgentCrew(): AgentCrew {
    return this.agentCrew;
  }

  getAgentOrchestration(): AgentOrchestration {
    return this.agentOrchestration;
  }

  getMemorySystem(): MemorySystem {
    return this.memorySystem;
  }

  getWorkflowEngine(): WorkflowEngine {
    return this.workflowEngine;
  }

  getUptimeMonitor(): ReturnType<typeof getUptimeMonitor> {
    return this.uptimeMonitor;
  }

  getHealthDashboard(): ReturnType<typeof getHealthDashboard> {
    return this.healthDashboard;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async getSystemStatus(): Promise<SystemStatus> {
    const uptimeStatus = this.uptimeMonitor.getStatus();
    const crewStatus = this.agentCrew.getStatus();
    const memoryStatus = this.memorySystem.getStatus();
    const dashboard = await this.healthDashboard.getDashboard();

    return {
      name: SYSTEM_CONFIG.name,
      version: SYSTEM_CONFIG.version,
      environment: SYSTEM_CONFIG.environment,
      initialized: this.initialized,
      uptime: dashboard.uptime,
      overallStatus: dashboard.overallStatus,
      services: dashboard.services,
      alerts: dashboard.alerts,
      components: {
        middleware: 'active',
        api: 'active',
        mcp: 'active',
        tracing: 'active',
        agents: crewStatus,
        workflows: this.workflowEngine.getStatus(),
        monitoring: uptimeStatus,
        memory: memoryStatus,
      },
      timestamp: new Date(),
    };
  }
}

/**
 * System Status
 */
export interface SystemStatus {
  name: string;
  version: string;
  environment: string;
  initialized: boolean;
  uptime: number;
  overallStatus: string;
  services: unknown[];
  alerts: unknown[];
  components: {
    middleware: string;
    api: string;
    mcp: string;
    tracing: string;
    agents: unknown;
    workflows: unknown;
    monitoring: unknown;
    memory: unknown;
  };
  timestamp: Date;
}

/**
 * Export singleton instance
 */
export const systemManager = SystemManager.getInstance();
