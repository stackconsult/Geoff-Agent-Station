import { nanoid } from 'nanoid';
import { z } from 'zod';

/**
 * MCP (Model Context Protocol) Server Configuration
 */
export const MCP_CONFIG = {
  SERVER_NAME: 'tolaria-mcp-server',
  SERVER_VERSION: '1.0.0',
  CAPABILITIES: {
    tools: true,
    resources: true,
    prompts: true,
  },
};

/**
 * MCP Tool Schema
 */
export const MCPToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  inputSchema: z.record(z.string(), z.unknown()),
  handler: z.function(),
});

export type MCPTool = z.infer<typeof MCPToolSchema>;

/**
 * MCP Resource Schema
 */
export const MCPResourceSchema = z.object({
  uri: z.string(),
  name: z.string(),
  description: z.string(),
  mimeType: z.string(),
  content: z.union([z.string(), z.record(z.string(), z.unknown())]),
});

export type MCPResource = z.infer<typeof MCPResourceSchema>;

/**
 * MCP Prompt Schema
 */
export const MCPPromptSchema = z.object({
  name: z.string(),
  description: z.string(),
  arguments: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      required: z.boolean(),
    })
  ),
  template: z.string(),
});

export type MCPPrompt = z.infer<typeof MCPPromptSchema>;

/**
 * MCP Request Schema
 */
export const MCPRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]),
  method: z.string(),
  params: z.record(z.string(), z.unknown()),
});

export type MCPRequest = z.infer<typeof MCPRequestSchema>;

/**
 * MCP Response Schema
 */
export const MCPResponseSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]),
  result: z.any().optional(),
  error: z
    .object({
      code: z.number(),
      message: z.string(),
      data: z.any().optional(),
    })
    .optional(),
});

export type MCPResponse = z.infer<typeof MCPResponseSchema>;

/**
 * MCP Error Codes
 */
export enum MCPErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  ServerNotInitialized = -32002,
}

/**
 * MCP Tool Registry
 */
export class MCPToolRegistry {
  private tools: Map<string, MCPTool> = new Map();

  registerTool(tool: MCPTool): void {
    this.tools.set(tool.name, tool);
  }

  unregisterTool(name: string): void {
    this.tools.delete(name);
  }

  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  listTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  async executeTool(name: string, input: unknown): Promise<unknown> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    try {
      // Validate input against schema
      if (tool.inputSchema) {
        const validated = z.object(tool.inputSchema).safeParse(input);
        if (!validated.success) {
          throw new Error(`Invalid input for tool ${name}: ${validated.error.message}`);
        }
        input = validated.data;
      }

      // Execute tool handler
      const result = await tool.handler(input as never);
      return result;
    } catch (error) {
      throw new Error(`Tool execution failed: ${name} - ${(error as Error).message}`);
    }
  }
}

/**
 * MCP Resource Registry
 */
export class MCPResourceRegistry {
  private resources: Map<string, MCPResource> = new Map();

  registerResource(resource: MCPResource): void {
    this.resources.set(resource.uri, resource);
  }

  unregisterResource(uri: string): void {
    this.resources.delete(uri);
  }

  getResource(uri: string): MCPResource | undefined {
    return this.resources.get(uri);
  }

  listResources(): MCPResource[] {
    return Array.from(this.resources.values());
  }

  async readResource(uri: string): Promise<unknown> {
    const resource = this.getResource(uri);
    if (!resource) {
      throw new Error(`Resource not found: ${uri}`);
    }

    return resource.content;
  }
}

/**
 * MCP Prompt Registry
 */
export class MCPPromptRegistry {
  private prompts: Map<string, MCPPrompt> = new Map();

  registerPrompt(prompt: MCPPrompt): void {
    this.prompts.set(prompt.name, prompt);
  }

  unregisterPrompt(name: string): void {
    this.prompts.delete(name);
  }

  getPrompt(name: string): MCPPrompt | undefined {
    return this.prompts.get(name);
  }

  listPrompts(): MCPPrompt[] {
    return Array.from(this.prompts.values());
  }

  async renderPrompt(
    name: string,
    args?: Record<string, unknown>
  ): Promise<string> {
    const prompt = this.getPrompt(name);
    if (!prompt) {
      throw new Error(`Prompt not found: ${name}`);
    }

    let template = prompt.template;

    // Replace placeholders with arguments
    if (args) {
      Object.entries(args).forEach(([key, value]) => {
        template = template.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });
    }

    return template;
  }
}

/**
 * MCP Server
 * Main MCP server implementation
 */
export class MCPServer {
  private toolRegistry: MCPToolRegistry;
  private resourceRegistry: MCPResourceRegistry;
  private promptRegistry: MCPPromptRegistry;
  private initialized: boolean = false;

  constructor() {
    this.toolRegistry = new MCPToolRegistry();
    this.resourceRegistry = new MCPResourceRegistry();
    this.promptRegistry = new MCPPromptRegistry();
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Register built-in tools
    await this.registerBuiltInTools();

    // Register built-in resources
    await this.registerBuiltInResources();

    // Register built-in prompts
    await this.registerBuiltInPrompts();

    this.initialized = true;
  }

  private async registerBuiltInTools(): Promise<void> {
    // File system tool
    this.toolRegistry.registerTool({
      name: 'read_file',
      description: 'Read the contents of a file',
      inputSchema: {
        path: { type: 'string' },
      },
      handler: async (input) => {
        const { path } = input as { path: string };
        // File reading implementation
        return { content: 'File content placeholder' };
      },
    });

    // File writing tool
    this.toolRegistry.registerTool({
      name: 'write_file',
      description: 'Write content to a file',
      inputSchema: {
        path: { type: 'string' },
        content: { type: 'string' },
      },
      handler: async (input) => {
        const { path, content } = input as { path: string; content: string };
        // File writing implementation
        return { success: true };
      },
    });

    // Directory listing tool
    this.toolRegistry.registerTool({
      name: 'list_directory',
      description: 'List files in a directory',
      inputSchema: {
        path: { type: 'string' },
      },
      handler: async (input) => {
        const { path } = input as { path: string };
        // Directory listing implementation
        return { files: [] };
      },
    });

    // Web search tool
    this.toolRegistry.registerTool({
      name: 'web_search',
      description: 'Search the web for information',
      inputSchema: {
        query: { type: 'string' },
        maxResults: { type: 'number', default: 10 },
      },
      handler: async (input) => {
        const { query, maxResults = 10 } = input as { query: string; maxResults: number };
        // Web search implementation
        return { results: [] };
      },
    });

    // Execute command tool
    this.toolRegistry.registerTool({
      name: 'execute_command',
      description: 'Execute a shell command',
      inputSchema: {
        command: { type: 'string' },
        args: { type: 'array', items: { type: 'string' } },
      },
      handler: async (input) => {
        const { command, args = [] } = input as { command: string; args: string[] };
        // Command execution implementation
        return { output: '', exitCode: 0 };
      },
    });
  }

  private async registerBuiltInResources(): Promise<void> {
    // System info resource
    this.resourceRegistry.registerResource({
      uri: 'system://info',
      name: 'System Information',
      description: 'Current system information',
      mimeType: 'application/json',
      content: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      },
    });

    // Environment resource
    this.resourceRegistry.registerResource({
      uri: 'system://environment',
      name: 'Environment Variables',
      description: 'Environment variables (sanitized)',
      mimeType: 'application/json',
      content: {
        nodeEnv: process.env.NODE_ENV,
        // Add other safe environment variables
      },
    });
  }

  private async registerBuiltInPrompts(): Promise<void> {
    // Code review prompt
    this.promptRegistry.registerPrompt({
      name: 'code_review',
      description: 'Generate a code review for the given code',
      arguments: [
        {
          name: 'code',
          description: 'The code to review',
          required: true,
        },
        {
          name: 'focus',
          description: 'Specific areas to focus on',
          required: false,
        },
      ],
      template: `Please review the following code:
{{code}}

${typeof focus !== 'undefined' ? `Focus areas: ${focus}` : ''}

Provide:
1. Overall assessment
2. Security concerns
3. Performance considerations
4. Code quality issues
5. Suggestions for improvement`,
    });

    // Documentation generation prompt
    this.promptRegistry.registerPrompt({
      name: 'generate_docs',
      description: 'Generate documentation for code',
      arguments: [
        {
          name: 'code',
          description: 'The code to document',
          required: true,
        },
        {
          name: 'style',
          description: 'Documentation style (javadoc, jsdoc, etc.)',
          required: false,
        },
      ],
      template: `Generate documentation for the following code:
{{code}}

${'style' in (arguments[0] || {}) ? `Style: ${(arguments[0] as any).style}` : ''}

Include:
1. Function/class descriptions
2. Parameter descriptions
3. Return value descriptions
4. Usage examples
5. Notes and warnings`,
    });
  }

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      let result: unknown;

      switch (request.method) {
        case 'initialize':
          result = await this.handleInitialize(request.params);
          break;
        case 'tools/list':
          result = await this.handleListTools();
          break;
        case 'tools/call':
          result = await this.handleToolCall(request.params);
          break;
        case 'resources/list':
          result = await this.handleListResources();
          break;
        case 'resources/read':
          result = await this.handleResourceRead(request.params);
          break;
        case 'prompts/list':
          result = await this.handleListPrompts();
          break;
        case 'prompts/get':
          result = await this.handlePromptGet(request.params);
          break;
        default:
          throw new Error(`Unknown method: ${request.method}`);
      }

      return {
        jsonrpc: '2.0',
        id: request.id,
        result,
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: MCPErrorCode.InternalError,
          message: (error as Error).message,
        },
      };
    }
  }

  private async handleInitialize(params: unknown): Promise<unknown> {
    const { protocolVersion, capabilities, clientInfo } = params as {
      protocolVersion?: string;
      capabilities?: unknown;
      clientInfo?: { name: string; version: string };
    };

    return {
      protocolVersion: '2024-11-05',
      capabilities: MCP_CONFIG.CAPABILITIES,
      serverInfo: {
        name: MCP_CONFIG.SERVER_NAME,
        version: MCP_CONFIG.SERVER_VERSION,
      },
    };
  }

  private async handleListTools(): Promise<unknown> {
    const tools = this.toolRegistry.listTools();
    return {
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  }

  private async handleToolCall(params: unknown): Promise<unknown> {
    const { name, arguments: args } = params as {
      name: string;
      arguments?: unknown;
    };

    const result = await this.toolRegistry.executeTool(name, args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleListResources(): Promise<unknown> {
    const resources = this.resourceRegistry.listResources();
    return {
      resources: resources.map((resource) => ({
        uri: resource.uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
      })),
    };
  }

  private async handleResourceRead(params: unknown): Promise<unknown> {
    const { uri } = params as { uri: string };
    const content = await this.resourceRegistry.readResource(uri);
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(content, null, 2),
        },
      ],
    };
  }

  private async handleListPrompts(): Promise<unknown> {
    const prompts = this.promptRegistry.listPrompts();
    return {
      prompts: prompts.map((prompt) => ({
        name: prompt.name,
        description: prompt.description,
        arguments: prompt.arguments,
      })),
    };
  }

  private async handlePromptGet(params: unknown): Promise<unknown> {
    const { name, arguments: args } = params as {
      name: string;
      arguments?: Record<string, unknown>;
    };

    const template = await this.promptRegistry.renderPrompt(name, args);
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: template,
          },
        },
      ],
    };
  }

  getToolRegistry(): MCPToolRegistry {
    return this.toolRegistry;
  }

  getResourceRegistry(): MCPResourceRegistry {
    return this.resourceRegistry;
  }

  getPromptRegistry(): MCPPromptRegistry {
    return this.promptRegistry;
  }
}

/**
 * MCP Client
 * Client for connecting to MCP servers
 */
export class MCPClient {
  private serverUrl: string;
  private requestId: number = 0;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  async call(method: string, params?: unknown): Promise<unknown> {
    const request: MCPRequest = {
      jsonrpc: '2.0',
      id: this.nextRequestId(),
      method,
      params: (params || {}) as Record<string, unknown>,
    };

    // In production, this would make an HTTP request to the MCP server
    // For now, return a placeholder
    return { result: 'MCP call placeholder' };
  }

  async listTools(): Promise<MCPTool[]> {
    const response = await this.call('tools/list');
    return (response as { tools: MCPTool[] }).tools;
  }

  async callTool(name: string, input: unknown): Promise<unknown> {
    const response = await this.call('tools/call', { name, arguments: input });
    return response;
  }

  async listResources(): Promise<MCPResource[]> {
    const response = await this.call('resources/list');
    return (response as { resources: MCPResource[] }).resources;
  }

  async readResource(uri: string): Promise<unknown> {
    const response = await this.call('resources/read', { uri });
    return response;
  }

  async listPrompts(): Promise<MCPPrompt[]> {
    const response = await this.call('prompts/list');
    return (response as { prompts: MCPPrompt[] }).prompts;
  }

  async getPrompt(
    name: string,
    args?: Record<string, unknown>
  ): Promise<unknown> {
    const response = await this.call('prompts/get', { name, args });
    return response;
  }

  private nextRequestId(): number {
    return ++this.requestId;
  }
}
