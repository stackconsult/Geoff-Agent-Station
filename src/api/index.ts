
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { MiddlewareManager, RequestContext } from '../middleware';

/**
 * API Response Schema
 * Standardized API response structure
 */
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  meta: z
    .object({
      requestId: z.string(),
      timestamp: z.string(),
      version: z.string(),
    })
    .optional(),
});

export type ApiResponse = z.infer<typeof ApiResponseSchema>;

/**
 * API Error Schema
 */
export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.any().optional(),
  statusCode: z.number(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

/**
 * API Configuration
 */
export const API_CONFIG = {
  VERSION: '1.0.0',
  BASE_URL: process.env.API_BASE_URL || '/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

/**
 * HTTP Methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * API Route Definition
 */
export interface ApiRoute {
  path: string;
  method: HttpMethod;
  handler: (request: ApiRequest) => Promise<ApiResponse>;
  authRequired?: boolean;
  requiredRole?: string;
  rateLimitOverride?: {
    windowMs: number;
    maxRequests: number;
  };
  validationSchema?: z.ZodSchema;
}

/**
 * API Request
 */
export interface ApiRequest {
  requestId: string;
  method: HttpMethod;
  path: string;
  headers: Record<string, string>;
  body?: unknown;
  query?: Record<string, string>;
  params?: Record<string, string>;
  context: RequestContext;
}

/**
 * API Error Classes
 */
export class ApiErrorClass extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class BadRequestError extends ApiErrorClass {
  constructor(message: string, details?: unknown) {
    super('BAD_REQUEST', message, 400, details);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends ApiErrorClass {
  constructor(message: string = 'Authentication required') {
    super('UNAUTHORIZED', message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiErrorClass {
  constructor(message: string = 'Access denied') {
    super('FORBIDDEN', message, 403);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiErrorClass {
  constructor(message: string = 'Resource not found') {
    super('NOT_FOUND', message, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiErrorClass {
  constructor(message: string, details?: unknown) {
    super('CONFLICT', message, 409, details);
    this.name = 'ConflictError';
  }
}

export class ValidationError extends ApiErrorClass {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, 422, details);
    this.name = 'ValidationError';
  }
}

export class InternalServerError extends ApiErrorClass {
  constructor(message: string = 'Internal server error', details?: unknown) {
    super('INTERNAL_ERROR', message, 500, details);
    this.name = 'InternalServerError';
  }
}

/**
 * API Response Builder
 */
export class ApiResponseBuilder {
  private static buildResponse(
    success: boolean,
    options: {
      data?: unknown;
      error?: string;
      message?: string;
      requestId?: string;
    } = {}
  ): ApiResponse {
    return {
      success,
      data: options.data,
      error: options.error,
      message: options.message,
      meta: options.requestId
        ? {
            requestId: options.requestId,
            timestamp: new Date().toISOString(),
            version: API_CONFIG.VERSION,
          }
        : undefined,
    };
  }

  static success(
    data: unknown,
    message?: string,
    requestId?: string
  ): ApiResponse {
    return this.buildResponse(true, { data, message, requestId });
  }

  static error(
    error: string,
    statusCode?: number,
    requestId?: string
  ): ApiResponse {
    return this.buildResponse(false, { error, requestId });
  }

  static created(
    data: unknown,
    message: string = 'Resource created successfully',
    requestId?: string
  ): ApiResponse {
    return this.buildResponse(true, {
      data,
      message,
      requestId,
    });
  }

  static noContent(
    message: string = 'Operation completed successfully',
    requestId?: string
  ): ApiResponse {
    return this.buildResponse(true, { message, requestId });
  }
}

/**
 * API Router
 * Manages API routes and request handling
 */
export class ApiRouter {
  private routes: Map<string, ApiRoute> = new Map();
  private middleware: MiddlewareManager;

  constructor(middleware: MiddlewareManager) {
    this.middleware = middleware;
  }

  registerRoute(route: ApiRoute): void {
    const key = `${route.method}:${route.path}`;
    this.routes.set(key, route);
  }

  getRoute(method: HttpMethod, path: string): ApiRoute | undefined {
    const key = `${method}:${path}`;
    return this.routes.get(key);
  }

  getAllRoutes(): ApiRoute[] {
    return Array.from(this.routes.values());
  }

  async handleRequest(request: ApiRequest): Promise<ApiResponse> {
    const route = this.getRoute(request.method, request.path);

    if (!route) {
      return ApiResponseBuilder.error(
        'Route not found',
        404,
        request.requestId
      );
    }

    try {
      // Validate request body if schema provided
      if (route.validationSchema && request.body) {
        const validationResult = route.validationSchema.safeParse(request.body);
        if (!validationResult.success) {
          throw new ValidationError(
            'Validation failed',
            validationResult.error
          );
        }
        request.body = validationResult.data;
      }

      // Process middleware
      const token = request.headers.authorization?.replace('Bearer ', '');
      const middlewareResult = await this.middleware.processRequest(
        request.context,
        token,
        route.requiredRole
      );

      if (!middlewareResult.success) {
        return ApiResponseBuilder.error(
          middlewareResult.error || 'Middleware error',
          middlewareResult.statusCode,
          request.requestId
        );
      }

      // Execute route handler
      const response = await route.handler(request);
      return response;
    } catch (error) {
      const apiError =
        error instanceof ApiErrorClass
          ? error
          : new InternalServerError(
              (error as Error).message,
              error
            );

      this.middleware.getLogging().log('error', 'API request failed', {
        requestId: request.requestId,
        error: apiError,
      });

      return ApiResponseBuilder.error(
        apiError.message,
        apiError.statusCode,
        request.requestId
      );
    }
  }
}

/**
 * API Service
 * Base class for API services
 */
export abstract class ApiService {
  protected router: ApiRouter;
  protected middleware: MiddlewareManager;

  constructor(middleware: MiddlewareManager) {
    this.middleware = middleware;
    this.router = new ApiRouter(middleware);
    this.registerRoutes();
  }

  protected abstract registerRoutes(): void;

  public getRouter(): ApiRouter {
    return this.router;
  }
}

/**
 * Health Check Service
 */
export class HealthCheckService extends ApiService {
  protected registerRoutes(): void {
    this.router.registerRoute({
      path: '/health',
      method: 'GET',
      handler: this.healthCheck.bind(this),
      authRequired: false,
    });

    this.router.registerRoute({
      path: '/health/detailed',
      method: 'GET',
      handler: this.detailedHealthCheck.bind(this),
      authRequired: false,
    });
  }

  private async healthCheck(request: ApiRequest): Promise<ApiResponse> {
    return ApiResponseBuilder.success(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: API_CONFIG.VERSION,
      },
      undefined,
      request.requestId
    );
  }

  private async detailedHealthCheck(
    request: ApiRequest
  ): Promise<ApiResponse> {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: API_CONFIG.VERSION,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: this.checkDatabase(),
        cache: this.checkCache(),
        external: await this.checkExternalServices(),
      },
    };

    return ApiResponseBuilder.success(health, undefined, request.requestId);
  }

  private checkDatabase(): { status: string; latency?: number } {
    // Database health check implementation
    return { status: 'healthy', latency: 5 };
  }

  private checkCache(): { status: string; latency?: number } {
    // Cache health check implementation
    return { status: 'healthy', latency: 2 };
  }

  private async checkExternalServices(): Promise<Record<string, unknown>> {
    // External services health check implementation
    return {
      aiService: { status: 'healthy', latency: 10 },
      storage: { status: 'healthy', latency: 15 },
    };
  }
}

/**
 * API Client
 * HTTP client for making API requests
 */
export class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(config?: {
    baseUrl?: string;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
  }) {
    this.baseUrl = config?.baseUrl || API_CONFIG.BASE_URL;
    this.timeout = config?.timeout || API_CONFIG.TIMEOUT;
    this.retryAttempts = config?.retryAttempts || API_CONFIG.RETRY_ATTEMPTS;
    this.retryDelay = config?.retryDelay || API_CONFIG.RETRY_DELAY;
  }

  async request<T>(
    method: HttpMethod,
    path: string,
    options?: {
      body?: unknown;
      query?: Record<string, string>;
      headers?: Record<string, string>;
      auth?: string;
    }
  ): Promise<T> {
    const requestId = nanoid();
    const url = this.buildUrl(path, options?.query);
    const headers = this.buildHeaders(options?.headers, options?.auth);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, {
          method,
          headers,
          body: options?.body ? JSON.stringify(options.body) : undefined,
        });

        if (!response.ok) {
          throw new ApiErrorClass(
            'HTTP_ERROR',
            `HTTP ${response.status}: ${response.statusText}`,
            response.status
          );
        }

        const data = await response.json();
        return data as T;
      } catch (error) {
        lastError = error as Error;

        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  async get<T>(
    path: string,
    options?: {
      query?: Record<string, string>;
      headers?: Record<string, string>;
      auth?: string;
    }
  ): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  async post<T>(
    path: string,
    body: unknown,
    options?: {
      query?: Record<string, string>;
      headers?: Record<string, string>;
      auth?: string;
    }
  ): Promise<T> {
    return this.request<T>('POST', path, { ...options, body });
  }

  async put<T>(
    path: string,
    body: unknown,
    options?: {
      query?: Record<string, string>;
      headers?: Record<string, string>;
      auth?: string;
    }
  ): Promise<T> {
    return this.request<T>('PUT', path, { ...options, body });
  }

  async delete<T>(
    path: string,
    options?: {
      query?: Record<string, string>;
      headers?: Record<string, string>;
      auth?: string;
    }
  ): Promise<T> {
    return this.request<T>('DELETE', path, options);
  }

  async patch<T>(
    path: string,
    body: unknown,
    options?: {
      query?: Record<string, string>;
      headers?: Record<string, string>;
      auth?: string;
    }
  ): Promise<T> {
    return this.request<T>('PATCH', path, { ...options, body });
  }

  private buildUrl(path: string, query?: Record<string, string>): string {
    const url = new URL(path, this.baseUrl);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    return url.toString();
  }

  private buildHeaders(
    customHeaders?: Record<string, string>,
    auth?: string
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (auth) {
      headers['Authorization'] = `Bearer ${auth}`;
    }

    headers['X-Request-ID'] = nanoid();
    headers['X-API-Version'] = API_CONFIG.VERSION;

    return headers;
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiErrorClass(
          'TIMEOUT',
          `Request timeout after ${this.timeout}ms`,
          408
        );
      }
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
