import { nanoid } from 'nanoid';

/**
 * OpenTelemetry Tracing Configuration
 */
export const TRACING_CONFIG = {
  SERVICE_NAME: 'tolaria-automation',
  SERVICE_VERSION: '1.0.0',
  EXPORTER_URL: process.env.OTEL_EXPORTER_URL || 'http://localhost:4318',
  SAMPLING_RATE: parseFloat(process.env.OTEL_SAMPLING_RATE || '1.0'),
  BATCH_SIZE: 512,
  EXPORT_TIMEOUT_MS: 30000,
  EXPORT_INTERVAL_MS: 5000,
};

/**
 * Span Status
 */
export enum SpanStatus {
  UNSET = 0,
  OK = 1,
  ERROR = 2,
}

/**
 * Span Kind
 */
export enum SpanKind {
  INTERNAL = 0,
  SERVER = 1,
  CLIENT = 2,
  PRODUCER = 3,
  CONSUMER = 4,
}

/**
 * Trace ID
 */
export class TraceId {
  private static readonly TRACE_ID_LENGTH = 32;
  private static readonly SPAN_ID_LENGTH = 16;

  static generate(): string {
    return nanoid(this.TRACE_ID_LENGTH);
  }

  static generateSpanId(): string {
    return nanoid(this.SPAN_ID_LENGTH);
  }

  static isValid(traceId: string): boolean {
    return traceId.length === this.TRACE_ID_LENGTH;
  }
}

/**
 * Span Attribute
 */
export interface SpanAttribute {
  key: string;
  value: string | number | boolean | string[];
}

/**
 * Span Event
 */
export interface SpanEvent {
  name: string;
  timestamp: number;
  attributes?: Record<string, unknown>;
}

/**
 * Span Link
 */
export interface SpanLink {
  traceId: string;
  spanId: string;
  attributes?: Record<string, unknown>;
}

/**
 * Span
 */
export class Span {
  public traceId: string;
  public spanId: string;
  public parentSpanId?: string;
  public name: string;
  public kind: SpanKind;
  public startTime: number;
  public endTime?: number;
  public status: SpanStatus = SpanStatus.UNSET;
  public statusMessage?: string;
  public attributes: Map<string, unknown> = new Map();
  public events: SpanEvent[] = [];
  public links: SpanLink[] = [];
  public childSpans: Span[] = [];

  constructor(
    name: string,
    kind: SpanKind = SpanKind.INTERNAL,
    parentSpanId?: string
  ) {
    this.name = name;
    this.kind = kind;
    this.parentSpanId = parentSpanId;
    this.traceId = parentSpanId
      ? this.extractTraceId(parentSpanId)
      : TraceId.generate();
    this.spanId = TraceId.generateSpanId();
    this.startTime = Date.now();
  }

  private extractTraceId(parentSpanId: string): string {
    // In a real implementation, this would extract the trace ID from the parent span context
    // For now, generate a new one
    return TraceId.generate();
  }

  setAttribute(key: string, value: unknown): void {
    this.attributes.set(key, value);
  }

  getAttribute(key: string): unknown {
    return this.attributes.get(key);
  }

  setAttributes(attributes: Record<string, unknown>): void {
    Object.entries(attributes).forEach(([key, value]) => {
      this.attributes.set(key, value);
    });
  }

  addEvent(name: string, attributes?: Record<string, unknown>): void {
    this.events.push({
      name,
      timestamp: Date.now(),
      attributes,
    });
  }

  addLink(link: SpanLink): void {
    this.links.push(link);
  }

  setStatus(status: SpanStatus, message?: string): void {
    this.status = status;
    this.statusMessage = message;
  }

  recordException(exception: Error): void {
    this.setStatus(SpanStatus.ERROR, exception.message);
    this.addEvent('exception', {
      'exception.type': exception.name,
      'exception.message': exception.message,
      'exception.stacktrace': exception.stack,
    });
  }

  end(endTime?: number): void {
    this.endTime = endTime || Date.now();
  }

  getDuration(): number {
    if (!this.endTime) {
      return Date.now() - this.startTime;
    }
    return this.endTime - this.startTime;
  }

  addChildSpan(span: Span): void {
    this.childSpans.push(span);
  }

  toObject(): unknown {
    return {
      traceId: this.traceId,
      spanId: this.spanId,
      parentSpanId: this.parentSpanId,
      name: this.name,
      kind: this.kind,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.getDuration(),
      status: this.status,
      statusMessage: this.statusMessage,
      attributes: Object.fromEntries(this.attributes),
      events: this.events,
      links: this.links,
      childSpans: this.childSpans.map((child) => child.toObject()),
    };
  }
}

/**
 * Tracer
 * Creates and manages spans
 */
export class Tracer {
  private name: string;
  private activeSpans: Map<string, Span> = new Map();
  private rootSpans: Span[] = [];

  constructor(name: string) {
    this.name = name;
  }

  startSpan(name: string, kind: SpanKind = SpanKind.INTERNAL): Span {
    const activeSpan = this.getActiveSpan();
    const parentSpanId = activeSpan ? activeSpan.spanId : undefined;

    const span = new Span(name, kind, parentSpanId);

    if (activeSpan) {
      activeSpan.addChildSpan(span);
    } else {
      this.rootSpans.push(span);
    }

    this.activeSpans.set(span.spanId, span);

    return span;
  }

  startActiveSpan(name: string, kind: SpanKind = SpanKind.INTERNAL): Span {
    const span = this.startSpan(name, kind);
    return span;
  }

  endSpan(span: Span): void {
    span.end();
    this.activeSpans.delete(span.spanId);
  }

  getActiveSpan(): Span | undefined {
    const spans = Array.from(this.activeSpans.values());
    return spans[spans.length - 1];
  }

  getCurrentTraceId(): string | undefined {
    const activeSpan = this.getActiveSpan();
    return activeSpan ? activeSpan.traceId : undefined;
  }

  getRootSpans(): Span[] {
    return this.rootSpans;
  }

  getSpanById(spanId: string): Span | undefined {
    const findSpan = (spans: Span[]): Span | undefined => {
      for (const span of spans) {
        if (span.spanId === spanId) {
          return span;
        }
        const found = findSpan(span.childSpans);
        if (found) {
          return found;
        }
      }
      return undefined;
    };

    return findSpan(this.rootSpans);
  }

  clear(): void {
    this.activeSpans.clear();
    this.rootSpans = [];
  }

  getTrace(traceId: string): Span | undefined {
    for (const span of this.rootSpans) {
      if (span.traceId === traceId) {
        return span;
      }
      const found = this.findTraceInSpan(span, traceId);
      if (found) {
        return found;
      }
    }
    return undefined;
  }

  private findTraceInSpan(span: Span, traceId: string): Span | undefined {
    if (span.traceId === traceId) {
      return span;
    }
    for (const child of span.childSpans) {
      const found = this.findTraceInSpan(child, traceId);
      if (found) {
        return found;
      }
    }
    return undefined;
  }
}

/**
 * Tracer Provider
 * Manages multiple tracers
 */
export class TracerProvider {
  private tracers: Map<string, Tracer> = new Map();
  private exporters: SpanExporter[] = [];
  private processors: SpanProcessor[] = [];

  constructor() {
    this.setupDefaultTracer();
  }

  private setupDefaultTracer(): void {
    const tracer = new Tracer(TRACING_CONFIG.SERVICE_NAME);
    this.tracers.set(TRACING_CONFIG.SERVICE_NAME, tracer);
  }

  getTracer(name?: string): Tracer {
    const tracerName = name || TRACING_CONFIG.SERVICE_NAME;
    let tracer = this.tracers.get(tracerName);

    if (!tracer) {
      tracer = new Tracer(tracerName);
      this.tracers.set(tracerName, tracer);
    }

    return tracer;
  }

  addExporter(exporter: SpanExporter): void {
    this.exporters.push(exporter);
  }

  addProcessor(processor: SpanProcessor): void {
    this.processors.push(processor);
  }

  async exportSpans(): Promise<void> {
    const allSpans: Span[] = [];

    for (const tracer of this.tracers.values()) {
      allSpans.push(...tracer.getRootSpans());
    }

    // Apply processors
    for (const processor of this.processors) {
      for (const span of allSpans) {
        await processor.onSpanEnd(span);
      }
    }

    // Export to all exporters
    for (const exporter of this.exporters) {
      await exporter.export(allSpans);
    }
  }

  shutdown(): Promise<void> {
    return this.exportSpans();
  }
}

/**
 * Span Processor
 * Processes spans before export
 */
export interface SpanProcessor {
  onSpanStart(span: Span): Promise<void> | void;
  onSpanEnd(span: Span): Promise<void> | void;
}

/**
 * Batch Span Processor
 */
export class BatchSpanProcessor implements SpanProcessor {
  private maxBatchSize: number;
  private batchTimeoutMs: number;
  private currentBatch: Span[] = [];
  private batchTimer?: NodeJS.Timeout;

  constructor(maxBatchSize: number = TRACING_CONFIG.BATCH_SIZE, batchTimeoutMs: number = TRACING_CONFIG.EXPORT_INTERVAL_MS) {
    this.maxBatchSize = maxBatchSize;
    this.batchTimeoutMs = batchTimeoutMs;
    this.startBatchTimer();
  }

  async onSpanStart(span: Span): Promise<void> {
    // No-op for batch processor
  }

  async onSpanEnd(span: Span): Promise<void> {
    this.currentBatch.push(span);

    if (this.currentBatch.length >= this.maxBatchSize) {
      await this.flush();
    }
  }

  private startBatchTimer(): void {
    this.batchTimer = setInterval(() => {
      this.flush();
    }, this.batchTimeoutMs);
  }

  private async flush(): Promise<void> {
    if (this.currentBatch.length === 0) {
      return;
    }

    const batch = [...this.currentBatch];
    this.currentBatch = [];

    // In production, this would export the batch to the exporter
    console.log(`Flushing ${batch.length} spans`);
  }

  shutdown(): Promise<void> {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    return this.flush();
  }
}

/**
 * Attribute Processor
 * Adds standard attributes to spans
 */
export class AttributeProcessor implements SpanProcessor {
  async onSpanStart(span: Span): Promise<void> {
    span.setAttribute('service.name', TRACING_CONFIG.SERVICE_NAME);
    span.setAttribute('service.version', TRACING_CONFIG.SERVICE_VERSION);
    span.setAttribute('telemetry.sdk.name', 'opentelemetry');
    span.setAttribute('telemetry.sdk.language', 'javascript');
    span.setAttribute('process.pid', process.pid);
    span.setAttribute('process.runtime.name', 'nodejs');
    span.setAttribute('process.runtime.version', process.version);
  }

  async onSpanEnd(span: Span): Promise<void> {
    span.setAttribute('span.duration_ms', span.getDuration());
  }
}

/**
 * Span Exporter
 * Exports spans to external systems
 */
export interface SpanExporter {
  export(spans: Span[]): Promise<void>;
  shutdown(): Promise<void>;
}

/**
 * Console Span Exporter
 * Exports spans to console for debugging
 */
export class ConsoleSpanExporter implements SpanExporter {
  async export(spans: Span[]): Promise<void> {
    for (const span of spans) {
      console.log(`[TRACE] ${span.traceId} - ${span.name} (${span.getDuration()}ms)`);
    }
  }

  async shutdown(): Promise<void> {
    // No-op
  }
}

/**
 * OTLP Span Exporter
 * Exports spans to OpenTelemetry Protocol (OTLP) endpoint
 */
export class OTLPSpanExporter implements SpanExporter {
  private exporterUrl: string;
  private headers: Record<string, string>;
  public name: string = 'OTLPSpanExporter';

  constructor(
    exporterUrl: string = TRACING_CONFIG.EXPORTER_URL,
    headers: Record<string, string> = {}
  ) {
    this.exporterUrl = exporterUrl;
    this.headers = headers;
  }

  async export(spans: Span[]): Promise<void> {
    const resourceSpans = this.convertToOTLP(spans);

    try {
      const response = await fetch(this.exporterUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.headers,
        },
        body: JSON.stringify(resourceSpans),
      });

      if (!response.ok) {
        throw new Error(`OTLP export failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('OTLP export error:', error);
    }
  }

  private convertToOTLP(spans: Span[]): unknown[] {
    // Convert spans to OTLP format
    return spans.map((span) => ({
      resource: {
        attributes: {
          'service.name': TRACING_CONFIG.SERVICE_NAME,
          'service.version': TRACING_CONFIG.SERVICE_VERSION,
        },
      },
      scopeSpans: [
        {
          scope: {
            name: this.name,
          },
          spans: [
            {
              traceId: this.hexEncode(span.traceId),
              spanId: this.hexEncode(span.spanId),
              parentSpanId: span.parentSpanId
                ? this.hexEncode(span.parentSpanId)
                : undefined,
              name: span.name,
              kind: this.mapSpanKind(span.kind),
              startTimeUnixNano: span.startTime * 1_000_000,
              endTimeUnixNano: (span.endTime || Date.now()) * 1_000_000,
              status: {
                code: span.status,
              },
              attributes: Object.fromEntries(span.attributes),
              events: span.events.map((event) => ({
                timeUnixNano: event.timestamp * 1_000_000,
                name: event.name,
                attributes: event.attributes,
              })),
              links: span.links,
            },
          ],
        },
      ],
    }));
  }

  private hexEncode(id: string): string {
    // Convert ID to hex format
    return Buffer.from(id).toString('hex').padStart(32, '0').slice(0, 32);
  }

  private mapSpanKind(kind: SpanKind): number {
    switch (kind) {
      case SpanKind.INTERNAL:
        return 0;
      case SpanKind.SERVER:
        return 1;
      case SpanKind.CLIENT:
        return 2;
      case SpanKind.PRODUCER:
        return 3;
      case SpanKind.CONSUMER:
        return 4;
      default:
        return 0;
    }
  }

  async shutdown(): Promise<void> {
    // No-op
  }
}

/**
 * Context Manager
 * Manages trace context propagation
 */
export class ContextManager {
  private contextKey = Symbol('trace-context');

  getCurrentContext(): Map<string, unknown> {
    // In a real implementation, this would use async local storage
    return new Map();
  }

  setCurrentContext(context: Map<string, unknown>): void {
    // In a real implementation, this would use async local storage
  }

  extractContext(headers: Record<string, string>): Map<string, unknown> {
    const context = new Map();

    if (headers['traceparent']) {
      const parts = headers['traceparent'].split('-');
      if (parts.length >= 2) {
        context.set('trace-id', parts[0]);
        context.set('span-id', parts[1]);
      }
    }

    if (headers['tracestate']) {
      context.set('trace-state', headers['tracestate']);
    }

    return context;
  }

  injectContext(headers: Record<string, string>): Record<string, string> {
    const context = this.getCurrentContext();
    const traceId = context.get('trace-id') as string;
    const spanId = context.get('span-id') as string;

    if (traceId && spanId) {
      headers['traceparent'] = `${traceId}-${spanId}-01`;
    }

    const traceState = context.get('trace-state');
    if (traceState) {
      headers['tracestate'] = String(traceState);
    }

    return headers;
  }
}

/**
 * Distributed Tracing Manager
 * Main entry point for distributed tracing
 */
export class DistributedTracingManager {
  private tracerProvider: TracerProvider;
  private contextManager: ContextManager;

  constructor() {
    this.tracerProvider = new TracerProvider();
    this.contextManager = new ContextManager();
    this.setupExporters();
    this.setupProcessors();
  }

  private setupExporters(): void {
    // Add console exporter for debugging
    this.tracerProvider.addExporter(new ConsoleSpanExporter());

    // Add OTLP exporter for production
    if (process.env.NODE_ENV === 'production') {
      this.tracerProvider.addExporter(new OTLPSpanExporter());
    }
  }

  private setupProcessors(): void {
    // Add attribute processor
    this.tracerProvider.addProcessor(new AttributeProcessor());

    // Add batch processor
    this.tracerProvider.addProcessor(new BatchSpanProcessor());
  }

  getTracer(name?: string): Tracer {
    return this.tracerProvider.getTracer(name);
  }

  getContextManager(): ContextManager {
    return this.contextManager;
  }

  async shutdown(): Promise<void> {
    await this.tracerProvider.shutdown();
  }
}

/**
 * Singleton instance
 */
let tracingManager: DistributedTracingManager | null = null;

export function getTracingManager(): DistributedTracingManager {
  if (!tracingManager) {
    tracingManager = new DistributedTracingManager();
  }
  return tracingManager;
}

/**
 * Tracing Decorator
 * Decorator for automatic tracing
 */
export function trace(name?: string) {
return function (
  target: object,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const spanName = name || `${(target as any).constructor.name}.${propertyKey}`;

  const originalMethod = descriptor.value;
  descriptor.value = async function (...args: unknown[]) {
    const tracingManager = getTracingManager();
    const tracer = tracingManager.getTracer();
    const span = tracer.startActiveSpan(spanName, SpanKind.INTERNAL);

    try {
      const result = await originalMethod.apply(this, args);
      span.setStatus(SpanStatus.OK);
      return result;
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      tracer.endSpan(span);
    }
      try {
        const result = await originalMethod.apply(this, args);
        span.setStatus(SpanStatus.OK);
        return result;
      } catch (error) {
        span.recordException(error as Error);
        throw error;
      } finally {
        tracer.endSpan(span);
      }
    };

    return descriptor;
  };
}
