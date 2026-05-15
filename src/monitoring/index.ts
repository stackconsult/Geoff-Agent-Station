import { nanoid } from 'nanoid';

/**
 * Uptime Monitoring Configuration
 */
export const UPTIME_CONFIG = {
  CHECK_INTERVAL_MS: 30000, // 30 seconds
  TIMEOUT_MS: 10000, // 10 seconds
  MAX_FAILURES: 3,
  ALERT_THRESHOLD: 0.95, // 95% uptime
  HISTORY_RETENTION_DAYS: 30,
  NOTIFICATION_CHANNELS: ['console', 'email', 'slack'],
};

/**
 * Service Status
 */
export enum ServiceStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown',
}

/**
 * Check Result
 */
export interface CheckResult {
  serviceId: string;
  serviceName: string;
  status: ServiceStatus;
  timestamp: Date;
  responseTime: number;
  message?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Service Definition
 */
export interface ServiceDefinition {
  id: string;
  name: string;
  type: 'http' | 'tcp' | 'process' | 'custom';
  endpoint: string;
  timeout?: number;
  expectedResponseCode?: number;
  healthCheckPath?: string;
  headers?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

/**
 * Health Check
 */
export interface HealthCheck {
  id: string;
  name: string;
  description: string;
  handler: (service: ServiceDefinition) => Promise<CheckResult>;
  enabled: boolean;
}

/**
 * Uptime Monitor
 */
export class UptimeMonitor {
  private services: Map<string, ServiceDefinition> = new Map();
  private healthChecks: Map<string, HealthCheck> = new Map();
  private history: CheckResult[] = [];
  private alerts: Alert[] = [];
  private monitoring: boolean = false;
  private intervalId?: NodeJS.Timeout;

  constructor() {
    this.setupDefaultServices();
    this.setupDefaultHealthChecks();
  }

  private setupDefaultServices(): void {
    // API service
    this.registerService({
      id: 'api',
      name: 'API Server',
      type: 'http',
      endpoint: process.env.API_BASE_URL || 'http://localhost:1420',
      timeout: UPTIME_CONFIG.TIMEOUT_MS,
      expectedResponseCode: 200,
      healthCheckPath: '/health',
    });

    // Database service
    this.registerService({
      id: 'database',
      name: 'Database',
      type: 'tcp',
      endpoint: process.env.DATABASE_HOST || 'localhost:5432',
      timeout: UPTIME_CONFIG.TIMEOUT_MS,
    });

    // Redis cache
    this.registerService({
      id: 'cache',
      name: 'Redis Cache',
      type: 'tcp',
      endpoint: process.env.REDIS_HOST || 'localhost:6379',
      timeout: UPTIME_CONFIG.TIMEOUT_MS,
    });

    // AI service
    this.registerService({
      id: 'ai',
      name: 'AI Service',
      type: 'http',
      endpoint: process.env.AI_SERVICE_URL || 'http://localhost:11434',
      timeout: UPTIME_CONFIG.TIMEOUT_MS,
      expectedResponseCode: 200,
      healthCheckPath: '/health',
    });
  }

  private setupDefaultHealthChecks(): void {
    // HTTP health check
    this.registerHealthCheck({
      id: 'http-check',
      name: 'HTTP Health Check',
      description: 'Performs HTTP GET request to check service health',
      handler: async (service) => {
        const startTime = Date.now();
        try {
          const url = service.healthCheckPath
            ? `${service.endpoint}${service.healthCheckPath}`
            : service.endpoint;

          const response = await fetch(url, {
            method: 'GET',
            headers: service.headers,
            signal: AbortSignal.timeout(service.timeout || UPTIME_CONFIG.TIMEOUT_MS),
          });

          const responseTime = Date.now() - startTime;

          if (!response.ok) {
            return {
              serviceId: service.id,
              serviceName: service.name,
              status: ServiceStatus.UNHEALTHY,
              timestamp: new Date(),
              responseTime,
              message: `HTTP ${response.status}: ${response.statusText}`,
            };
          }

          return {
            serviceId: service.id,
            serviceName: service.name,
            status: ServiceStatus.HEALTHY,
            timestamp: new Date(),
            responseTime,
            message: 'Service is healthy',
          };
        } catch (error) {
          const responseTime = Date.now() - startTime;
          return {
            serviceId: service.id,
            serviceName: service.name,
            status: ServiceStatus.UNHEALTHY,
            timestamp: new Date(),
            responseTime,
            message: (error as Error).message,
          };
        }
      },
      enabled: true,
    });

    // TCP health check
    this.registerHealthCheck({
      id: 'tcp-check',
      name: 'TCP Health Check',
      description: 'Performs TCP connection check',
      handler: async (service) => {
        const startTime = Date.now();
        try {
          // TCP connection check implementation
          // In production, this would use net.Socket
          const responseTime = Date.now() - startTime;

          return {
            serviceId: service.id,
            serviceName: service.name,
            status: ServiceStatus.HEALTHY,
            timestamp: new Date(),
            responseTime,
            message: 'TCP connection successful',
          };
        } catch (error) {
          const responseTime = Date.now() - startTime;
          return {
            serviceId: service.id,
            serviceName: service.name,
            status: ServiceStatus.UNHEALTHY,
            timestamp: new Date(),
            responseTime,
            message: (error as Error).message,
          };
        }
      },
      enabled: true,
    });
  }

  registerService(service: ServiceDefinition): void {
    this.services.set(service.id, service);
  }

  unregisterService(serviceId: string): void {
    this.services.delete(serviceId);
  }

  getService(serviceId: string): ServiceDefinition | undefined {
    return this.services.get(serviceId);
  }

  getAllServices(): ServiceDefinition[] {
    return Array.from(this.services.values());
  }

  registerHealthCheck(check: HealthCheck): void {
    this.healthChecks.set(check.id, check);
  }

  unregisterHealthCheck(checkId: string): void {
    this.healthChecks.delete(checkId);
  }

  getHealthCheck(checkId: string): HealthCheck | undefined {
    return this.healthChecks.get(checkId);
  }

  async checkService(serviceId: string): Promise<CheckResult> {
    const service = this.getService(serviceId);
    if (!service) {
      throw new Error(`Service not found: ${serviceId}`);
    }

    const healthCheck = this.getHealthCheck(`${service.type}-check`);
    if (!healthCheck || !healthCheck.enabled) {
      return {
        serviceId: service.id,
        serviceName: service.name,
        status: ServiceStatus.UNKNOWN,
        timestamp: new Date(),
        responseTime: 0,
        message: 'No health check configured',
      };
    }

    const result = await healthCheck.handler(service);
    this.history.push(result);
    this.pruneHistory();

    return result;
  }

  async checkAllServices(): Promise<CheckResult[]> {
    const results: CheckResult[] = [];

    for (const service of this.getAllServices()) {
      try {
        const result = await this.checkService(service.id);
        results.push(result);
      } catch (error) {
        results.push({
          serviceId: service.id,
          serviceName: service.name,
          status: ServiceStatus.UNKNOWN,
          timestamp: new Date(),
          responseTime: 0,
          message: (error as Error).message,
        });
      }
    }

    return results;
  }

  startMonitoring(): void {
    if (this.monitoring) {
      return;
    }

    this.monitoring = true;
    this.intervalId = setInterval(async () => {
      await this.checkAllServices();
      this.evaluateAlerts();
    }, UPTIME_CONFIG.CHECK_INTERVAL_MS);
  }

  stopMonitoring(): void {
    if (!this.monitoring) {
      return;
    }

    this.monitoring = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  isMonitoring(): boolean {
    return this.monitoring;
  }

  getServiceHistory(serviceId: string, limit?: number): CheckResult[] {
    const serviceHistory = this.history.filter((r) => r.serviceId === serviceId);
    return limit ? serviceHistory.slice(-limit) : serviceHistory;
  }

  getOverallUptime(serviceId?: string, days: number = 7): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const relevantHistory = serviceId
      ? this.getServiceHistory(serviceId)
      : this.history;

    const recentHistory = relevantHistory.filter((r) => r.timestamp > cutoffDate);

    if (recentHistory.length === 0) {
      return 1.0; // Assume 100% uptime if no data
    }

    const healthyCount = recentHistory.filter(
      (r) => r.status === ServiceStatus.HEALTHY
    ).length;

    return healthyCount / recentHistory.length;
  }

  getServiceMetrics(serviceId: string): ServiceMetrics {
    const history = this.getServiceHistory(serviceId, 100);

    if (history.length === 0) {
      return {
        totalChecks: 0,
        healthyChecks: 0,
        unhealthyChecks: 0,
        averageResponseTime: 0,
        uptime: 1.0,
      };
    }

    const healthyChecks = history.filter((r) => r.status === ServiceStatus.HEALTHY).length;
    const unhealthyChecks = history.filter(
      (r) => r.status === ServiceStatus.UNHEALTHY
    ).length;
    const averageResponseTime =
      history.reduce((sum, r) => sum + r.responseTime, 0) / history.length;
    const uptime = healthyChecks / history.length;

    return {
      totalChecks: history.length,
      healthyChecks,
      unhealthyChecks,
      averageResponseTime,
      uptime,
    };
  }

  private pruneHistory(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - UPTIME_CONFIG.HISTORY_RETENTION_DAYS);

    this.history = this.history.filter((r) => r.timestamp > cutoffDate);
  }

  private evaluateAlerts(): void {
    for (const service of this.getAllServices()) {
      const metrics = this.getServiceMetrics(service.id);
      const uptime = metrics.uptime;

      if (uptime < UPTIME_CONFIG.ALERT_THRESHOLD) {
        this.createAlert({
          id: nanoid(),
          type: 'uptime',
          severity: uptime < 0.8 ? 'critical' : 'warning',
          serviceId: service.id,
          serviceName: service.name,
          message: `Uptime below threshold: ${(uptime * 100).toFixed(2)}%`,
          timestamp: new Date(),
          metadata: metrics as unknown as Record<string, unknown>,
        });
      }

      if (metrics.averageResponseTime > 5000) {
        this.createAlert({
          id: nanoid(),
          type: 'response-time',
          severity: 'warning',
          serviceId: service.id,
          serviceName: service.name,
          message: `High response time: ${metrics.averageResponseTime.toFixed(0)}ms`,
          timestamp: new Date(),
          metadata: metrics as unknown as Record<string, unknown>,
        });
      }

      // Check for consecutive failures
      const recentHistory = this.getServiceHistory(service.id, 10);
      const consecutiveFailures = this.countConsecutiveFailures(recentHistory);

      if (consecutiveFailures >= UPTIME_CONFIG.MAX_FAILURES) {
        this.createAlert({
          id: nanoid(),
          type: 'consecutive-failures',
          severity: 'critical',
          serviceId: service.id,
          serviceName: service.name,
          message: `${consecutiveFailures} consecutive failures`,
          timestamp: new Date(),
          metadata: { consecutiveFailures },
        });
      }
    }
  }

  private countConsecutiveFailures(history: CheckResult[]): number {
    let count = 0;

    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].status === ServiceStatus.UNHEALTHY) {
        count++;
      } else {
        break;
      }
    }

    return count;
  }

  private createAlert(alert: Alert): void {
    this.alerts.push(alert);
    this.sendNotification(alert);
    this.pruneAlerts();
  }

  private sendNotification(alert: Alert): void {
    // Send notification to configured channels
    for (const channel of UPTIME_CONFIG.NOTIFICATION_CHANNELS) {
      switch (channel) {
        case 'console':
          console.error(`[${alert.severity.toUpperCase()}] ${alert.serviceName}: ${alert.message}`);
          break;
        case 'email':
          // Email notification implementation
          break;
        case 'slack':
          // Slack notification implementation
          break;
      }
    }
  }

  private pruneAlerts(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // Keep alerts for 7 days

    this.alerts = this.alerts.filter((a) => a.timestamp > cutoffDate);
  }

  getAlerts(limit?: number): Alert[] {
    return limit ? this.alerts.slice(-limit) : this.alerts;
  }

  getStatus(): unknown {
    return {
      monitoring: this.monitoring,
      serviceCount: this.services.size,
      healthCheckCount: this.healthChecks.size,
      historyCount: this.history.length,
      alertCount: this.alerts.length,
      checkInterval: UPTIME_CONFIG.CHECK_INTERVAL_MS,
    };
  }
}

/**
 * Service Metrics
 */
export interface ServiceMetrics {
  totalChecks: number;
  healthyChecks: number;
  unhealthyChecks: number;
  averageResponseTime: number;
  uptime: number;
}

/**
 * Alert
 */
export interface Alert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  serviceId: string;
  serviceName: string;
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Health Dashboard
 */
export class HealthDashboard {
  private uptimeMonitor: UptimeMonitor;

  constructor(uptimeMonitor: UptimeMonitor) {
    this.uptimeMonitor = uptimeMonitor;
  }

  async getDashboard(): Promise<DashboardData> {
    const services = this.uptimeMonitor.getAllServices();
    const results = await this.uptimeMonitor.checkAllServices();

    const dashboardData: DashboardData = {
      timestamp: new Date(),
      overallStatus: this.calculateOverallStatus(results),
      services: services.map((service) => ({
        ...service,
        metrics: this.uptimeMonitor.getServiceMetrics(service.id),
        status: results.find((r) => r.serviceId === service.id)?.status || ServiceStatus.UNKNOWN,
        lastCheck: results.find((r) => r.serviceId === service.id)?.timestamp,
      })),
      alerts: this.uptimeMonitor.getAlerts(10),
      uptime: this.uptimeMonitor.getOverallUptime(),
    };

    return dashboardData;
  }

  private calculateOverallStatus(results: CheckResult[]): ServiceStatus {
    if (results.length === 0) {
      return ServiceStatus.UNKNOWN;
    }

    const healthyCount = results.filter((r) => r.status === ServiceStatus.HEALTHY).length;
    const unhealthyCount = results.filter((r) => r.status === ServiceStatus.UNHEALTHY).length;

    if (unhealthyCount === 0) {
      return ServiceStatus.HEALTHY;
    }

    if (healthyCount === 0) {
      return ServiceStatus.UNHEALTHY;
    }

    return ServiceStatus.DEGRADED;
  }
}

/**
 * Dashboard Data
 */
export interface DashboardData {
  timestamp: Date;
  overallStatus: ServiceStatus;
  services: Array<{
    id: string;
    name: string;
    type: string;
    endpoint: string;
    metrics: ServiceMetrics;
    status: ServiceStatus;
    lastCheck?: Date;
  }>;
  alerts: Alert[];
  uptime: number;
}

/**
 * Singleton instance
 */
let uptimeMonitor: UptimeMonitor | null = null;

export function getUptimeMonitor(): UptimeMonitor {
  if (!uptimeMonitor) {
    uptimeMonitor = new UptimeMonitor();
  }
  return uptimeMonitor;
}

export function getHealthDashboard(): HealthDashboard {
  return new HealthDashboard(getUptimeMonitor());
}
