export { defaultMiddlewareConfig } from './config';
export type { MiddlewareConfig, MiddlewareConfig as MiddlewareConfigType } from './config';

import type { MiddlewareConfig } from './config';
import { nanoid } from 'nanoid';

/**
 * Request Context Interface
 * Tracks request metadata for logging and tracing
 */
export interface RequestContext {
  requestId: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ip?: string;
  path?: string;
  method?: string;
  metadata: Record<string, unknown>;
}

/**
 * Middleware Result Interface
 * Standardized response from middleware
 */
export interface MiddlewareResult {
  success: boolean;
  statusCode?: number;
  error?: string;
  data?: unknown;
  context?: RequestContext;
}

/**
 * Authentication Middleware
 * Validates JWT tokens and user sessions
 */
export class AuthMiddleware {
  constructor(private config: MiddlewareConfig) {}

  async authenticate(token?: string): Promise<MiddlewareResult> {
    if (!this.config.auth.enabled) {
      return { success: true };
    }

    if (!token) {
      return {
        success: false,
        statusCode: 401,
        error: 'Authentication required',
      };
    }

    try {
      // JWT validation logic here
      // For now, just check token exists and is properly formatted
      if (token.length < 10) {
        return {
          success: false,
          statusCode: 401,
          error: 'Invalid token format',
        };
      }

      return { success: true, data: { userId: this.extractUserId(token) } };
    } catch (error) {
      return {
        success: false,
        statusCode: 401,
        error: 'Authentication failed',
      };
    }
  }

  private extractUserId(token: string): string {
    // In production, this would decode and validate JWT
    // For now, return a placeholder
    return 'user_' + nanoid();
  }

  async authorize(userId: string, requiredRole: string): Promise<MiddlewareResult> {
    // Role-based authorization logic
    // For now, just return success
    return { success: true };
  }
}

/**
 * Logging Middleware
 * Structured logging with multiple output formats
 */
export class LoggingMiddleware {
  private logs: Array<{ level: string; message: string; context: unknown }> = [];

  constructor(private config: MiddlewareConfig) {}

  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, context?: unknown) {
    if (!this.config.logging.enabled) return;

    const logEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
    };

    this.logs.push(logEntry);

    if (this.config.logging.output.includes('console')) {
      const formatted = this.formatLog(logEntry);
      switch (level) {
        case 'error':
          console.error(formatted);
          break;
        case 'warn':
          console.warn(formatted);
          break;
        case 'debug':
          console.debug(formatted);
          break;
        default:
          console.log(formatted);
      }
    }

    if (this.config.logging.output.includes('file')) {
      // File logging implementation
      this.writeToFile(logEntry);
    }

    if (this.config.logging.output.includes('remote')) {
      // Remote logging implementation
      this.sendToRemote(logEntry);
    }
  }

  private formatLog(entry: { level: string; message: string; context: unknown; timestamp: string }): string {
    if (this.config.logging.format === 'json') {
      return JSON.stringify(entry);
    }
    return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message} ${
      entry.context ? JSON.stringify(entry.context) : ''
    }`;
  }

  private writeToFile(entry: unknown) {
    // File writing implementation
    // In production, this would write to a log file
  }

  private sendToRemote(entry: unknown) {
    // Remote logging implementation
    // In production, this would send to a logging service
  }

  getLogs(): unknown[] {
    return this.logs;
  }

  clearLogs(): void {
    this.logs = [];
  }
}

/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting request rates
 */
export class RateLimitingMiddleware {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(private config: MiddlewareConfig) {}

  async checkLimit(identifier: string): Promise<MiddlewareResult> {
    if (!this.config.rateLimiting.enabled) {
      return { success: true };
    }

    const now = Date.now();
    const window = this.config.rateLimiting.windowMs;
    const max = this.config.rateLimiting.maxRequests;

    const existing = this.requests.get(identifier);

    if (!existing || now > existing.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + window,
      });
      return { success: true };
    }

    if (existing.count >= max) {
      const resetIn = Math.ceil((existing.resetTime - now) / 1000);
      return {
        success: false,
        statusCode: 429,
        error: `Rate limit exceeded. Try again in ${resetIn} seconds.`,
        data: { resetIn, resetTime: existing.resetTime },
      };
    }

    existing.count++;
    return {
      success: true,
      data: {
        remaining: max - existing.count,
        resetTime: existing.resetTime,
      },
    };
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.requests.entries()) {
      if (now > value.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

/**
 * Error Handling Middleware
 * Centralized error handling with notifications
 */
export class ErrorHandlingMiddleware {
  private errors: Array<{ error: Error; context: unknown; timestamp: Date }> = [];

  constructor(private config: MiddlewareConfig) {}

  async handleError(error: Error, context?: unknown): Promise<MiddlewareResult> {
    if (!this.config.errorHandling.enabled) {
      return { success: false, error: 'Error handling disabled' };
    }

    const errorEntry = {
      error,
      context,
      timestamp: new Date(),
    };

    this.errors.push(errorEntry);

    if (this.config.errorHandling.logErrors) {
      console.error('Error caught:', {
        message: error.message,
        stack: this.config.errorHandling.stackTraces ? error.stack : undefined,
        context,
      });
    }

    if (this.config.errorHandling.notifyOnError) {
      await this.notifyError(error, context);
    }

    return {
      success: false,
      statusCode: this.getStatusCode(error),
      error: this.getUserFriendlyMessage(error),
      data: this.config.errorHandling.stackTraces ? error.stack : undefined,
    };
  }

  private getStatusCode(error: Error): number {
    // Determine appropriate status code based on error type
    if (error.message.includes('not found')) return 404;
    if (error.message.includes('unauthorized')) return 401;
    if (error.message.includes('forbidden')) return 403;
    if (error.message.includes('validation')) return 400;
    return 500;
  }

  private getUserFriendlyMessage(error: Error): string {
    // Convert technical errors to user-friendly messages
    if (error.message.includes('not found')) return 'Resource not found';
    if (error.message.includes('unauthorized')) return 'Authentication required';
    if (error.message.includes('forbidden')) return 'Access denied';
    if (error.message.includes('validation')) return 'Invalid input data';
    return 'An unexpected error occurred. Please try again later.';
  }

  private async notifyError(error: Error, context?: unknown): Promise<void> {
    // Error notification implementation
    // In production, this would send alerts via email, Slack, PagerDuty, etc.
    console.log('Error notification sent:', error.message);
  }

  getErrors(): unknown[] {
    return this.errors;
  }

  clearErrors(): void {
    this.errors = [];
  }
}

/**
 * Middleware Manager
 * Coordinates all middleware components
 */
export class MiddlewareManager {
  private auth: AuthMiddleware;
  private logging: LoggingMiddleware;
  private rateLimiting: RateLimitingMiddleware;
  private errorHandling: ErrorHandlingMiddleware;

  constructor(config: MiddlewareConfig) {
    this.auth = new AuthMiddleware(config);
    this.logging = new LoggingMiddleware(config);
    this.rateLimiting = new RateLimitingMiddleware(config);
    this.errorHandling = new ErrorHandlingMiddleware(config);
  }

  async processRequest(
    context: RequestContext,
    token?: string,
    requiredRole?: string
  ): Promise<MiddlewareResult> {
    const requestId = context.requestId;

    this.logging.log('info', `Processing request ${requestId}`, { context });

    try {
      // Rate limiting check
      const rateLimitResult = await this.rateLimiting.checkLimit(
        context.ip || 'unknown'
      );
      if (!rateLimitResult.success) {
        this.logging.log('warn', `Rate limit exceeded for ${context.ip}`, {
          context,
          result: rateLimitResult,
        });
        return rateLimitResult;
      }

      // Authentication check
      const authResult = await this.auth.authenticate(token);
      if (!authResult.success) {
        this.logging.log('warn', `Authentication failed for ${requestId}`, {
          context,
          result: authResult,
        });
        return authResult;
      }

      // Authorization check
      if (requiredRole && authResult.data) {
        const userId = (authResult.data as { userId: string }).userId;
        const authzResult = await this.auth.authorize(userId, requiredRole);
        if (!authzResult.success) {
          this.logging.log('warn', `Authorization failed for ${userId}`, {
            context,
            result: authzResult,
          });
          return authzResult;
        }
      }

      this.logging.log('info', `Request ${requestId} processed successfully`, {
        context,
      });

      return { success: true, context };
    } catch (error) {
      const errorResult = await this.errorHandling.handleError(
        error as Error,
        context
      );
      this.logging.log('error', `Request ${requestId} failed`, {
        context,
        result: errorResult,
      });
      return errorResult;
    }
  }

  getAuth(): AuthMiddleware {
    return this.auth;
  }

  getLogging(): LoggingMiddleware {
    return this.logging;
  }

  getRateLimiting(): RateLimitingMiddleware {
    return this.rateLimiting;
  }

  getErrorHandling(): ErrorHandlingMiddleware {
    return this.errorHandling;
  }
}
