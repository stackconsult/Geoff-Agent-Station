import { z } from 'zod';

/**
 * Middleware Configuration Schema
 * Defines the structure for middleware configuration
 */
export const MiddlewareConfigSchema = z.object({
  auth: z.object({
    enabled: z.boolean(),
    jwtSecret: z.string().min(32),
    tokenExpiration: z.string(),
    refreshExpiration: z.string(),
  }),
  logging: z.object({
    enabled: z.boolean(),
    level: z.enum(['debug', 'info', 'warn', 'error']),
    format: z.enum(['json', 'text']),
    output: z.array(z.enum(['console', 'file', 'remote'])),
  }),
  rateLimiting: z.object({
    enabled: z.boolean(),
    windowMs: z.number(),
    maxRequests: z.number(),
    skipSuccessfulRequests: z.boolean(),
  }),
  errorHandling: z.object({
    enabled: z.boolean(),
    stackTraces: z.boolean(),
    logErrors: z.boolean(),
    notifyOnError: z.boolean(),
  }),
});

export type MiddlewareConfig = z.infer<typeof MiddlewareConfigSchema>;

/**
 * Default middleware configuration
 */
export const defaultMiddlewareConfig: MiddlewareConfig = {
  auth: {
    enabled: true,
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    tokenExpiration: '1h',
    refreshExpiration: '7d',
  },
  logging: {
    enabled: true,
    level: 'info',
    format: 'json',
    output: ['console', 'file'],
  },
  rateLimiting: {
    enabled: true,
    windowMs: 60000, // 1 minute
    maxRequests: 100,
    skipSuccessfulRequests: true,
  },
  errorHandling: {
    enabled: true,
    stackTraces: process.env.NODE_ENV === 'development',
    logErrors: true,
    notifyOnError: true,
  },
};
