/**
 * Ghost agent loop for 0xRIP.
 *
 * Calls the Anthropic Messages API via raw fetch with a tool-use loop.
 * The agent repeatedly calls Claude until it produces a text-only response
 * (no more tool_use blocks), up to a maximum number of iterations.
 */

import type { Grave } from '../types';
import { ContextManager, type Message } from './context';
import { imageTool } from './tools/mmx-image';
import { musicTool } from './tools/mmx-music';
import { videoTool } from './tools/mmx-video';
import { speechTool } from './tools/mmx-speech';
import { visionTool } from './tools/mmx-vision';

// ── Types ──────────────────────────────────────────────────────

export interface AgentTool {
  name: string;
  description: string;
  input_schema: object; // JSON Schema
  handler: (input: Record<string, any>) => Promise<string>;
}

// ── Constants ──────────────────────────────────────────────────

const ANTHROPIC_API_URL = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com') + '/v1/messages';
const MODEL = 'MiniMax-M2.7';
const MAX_TOKENS = 4096;
const MAX_TOOL_ITERATIONS = 5;

// ── Anthropic API types (minimal) ──────────────────────────────

interface ApiContentBlock {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, any>;
  tool_use_id?: string;
  content?: string;
}

interface ApiResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: ApiContentBlock[];
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use';
  usage: { input_tokens: number; output_tokens: number };
}

// ── GhostAgent ─────────────────────────────────────────────────

export class GhostAgent {
  private tools: AgentTool[];
  private context: ContextManager;

  constructor(tools: AgentTool[]) {
    this.tools = tools;
    this.context = new ContextManager();
  }

  /**
   * Run one agent loop iteration:
   *  1. Build messages via ContextManager
   *  2. Call Claude API with tools
   *  3. If response has tool_use blocks, execute handlers and append results
   *  4. Repeat until text-only response or max iterations
   *  5. Save exchange to memory and return final text
   */
  async chat(
    grave: Grave,
    sessionId: string,
    userMessage: string,
  ): Promise<string> {
    // Build initial message list
    const messages = await this.context.buildMessages(
      grave,
      sessionId,
      userMessage,
    );

    // Strip the system message out -- it goes in the top-level `system` param
    const systemPrompt = (messages.shift() as Message).content;

    // Working copy of conversation messages (no system)
    const conversation: Array<{ role: string; content: any }> = messages.map(
      (m) => ({ role: m.role, content: m.content }),
    );

    const toolSchemas = this.tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema,
    }));

    // Iterative tool-use loop
    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const response = await this.callClaude(
        systemPrompt,
        conversation,
        toolSchemas,
      );

      // Collect all content blocks
      const textParts: string[] = [];
      const toolUseBlocks: ApiContentBlock[] = [];

      for (const block of response.content) {
        if (block.type === 'text' && block.text) {
          textParts.push(block.text);
        } else if (block.type === 'tool_use') {
          toolUseBlocks.push(block);
        }
      }

      // If no tool calls, we are done -- return concatenated text
      if (toolUseBlocks.length === 0) {
        const finalText = textParts.join('\n');

        // Persist the exchange
        await this.context.saveExchange(
          grave.id,
          sessionId,
          userMessage,
          finalText,
        );

        return finalText;
      }

      // Append the assistant turn with all content blocks
      conversation.push({
        role: 'assistant',
        content: response.content,
      });

      // Execute each tool and collect results
      const toolResults: Array<{
        type: 'tool_result';
        tool_use_id: string;
        content: string;
      }> = [];

      for (const toolBlock of toolUseBlocks) {
        const toolName = toolBlock.name!;
        const toolInput = toolBlock.input ?? {};
        const toolUseId = toolBlock.id!;

        const tool = this.tools.find((t) => t.name === toolName);
        if (!tool) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUseId,
            content: `Error: unknown tool "${toolName}"`,
          });
          continue;
        }

        try {
          const result = await tool.handler(toolInput);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUseId,
            content: result,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUseId,
            content: `Error: ${msg}`,
          });
        }
      }

      // Append tool results as a user message (required by the API)
      conversation.push({
        role: 'user',
        content: toolResults,
      });
    }

    // Safety net: if we exhausted iterations, return whatever text we have
    const fallback = '...the signal fades into static.';
    await this.context.saveExchange(
      grave.id,
      sessionId,
      userMessage,
      fallback,
    );
    return fallback;
  }

  // ── Private ──────────────────────────────────────────────────

  /**
   * Call the Anthropic Messages API via fetch.
   */
  private async callClaude(
    system: string,
    messages: Array<{ role: string; content: any }>,
    tools: Array<{ name: string; description: string; input_schema: object }>,
  ): Promise<ApiResponse> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }

    const body: Record<string, any> = {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages,
    };

    if (tools.length > 0) {
      body.tools = tools;
    }

    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(
        `Anthropic API error ${res.status}: ${errorBody}`,
      );
    }

    return (await res.json()) as ApiResponse;
  }
}

// ── Factory ────────────────────────────────────────────────────

/**
 * Create a GhostAgent equipped with all mmx tools.
 *
 * Tool implementations live in agent/tools/ and wrap the mmx CLI.
 * Each tool exports an AgentTool object with name, schema, and handler.
 */
export function createGhostAgent(): GhostAgent {
  return new GhostAgent([
    imageTool,
    musicTool,
    videoTool,
    speechTool,
    visionTool,
  ]);
}
