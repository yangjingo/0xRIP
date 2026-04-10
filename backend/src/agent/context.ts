/**
 * Context manager for 0xRIP ghost conversations.
 *
 * Assembles the full message array sent to the Claude API:
 *   [system_prompt, ...conversation_history, user_message]
 *
 * Short-term memory lives on the filesystem (.rip/<grave_id>/sessions/).
 * Long-term memory lives in SQLite (promoted from short-term).
 */

import type { Grave } from '../types';
import { addMemory, readGraveShortTerm } from '../services/memory';
import { db, eq } from '../db/client';
import { memories } from '../db/schema';
import { buildGhostPrompt } from './prompts/ghost';

// ── Types ──────────────────────────────────────────────────────

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// ── ContextManager ─────────────────────────────────────────────

export class ContextManager {
  /**
   * Build the full messages array for a Claude API call.
   * Order: [system_prompt, ...history, user_message]
   */
  async buildMessages(
    grave: Grave,
    sessionId: string,
    userMessage: string,
  ): Promise<Message[]> {
    const systemPrompt = this.getSystemPrompt(grave);
    const history = await this.getConversationHistory(grave.id, sessionId);

    return [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userMessage },
    ];
  }

  /**
   * Return the system prompt combining ghost persona and memory context.
   */
  getSystemPrompt(grave: Grave): string {
    return buildGhostPrompt({ name: grave.name, epitaph: grave.epitaph });
  }

  /**
   * Load and merge short-term (filesystem) and long-term (SQLite) memories
   * for a grave. Returns a formatted string or empty string if none exist.
   */
  async getMemoryContext(graveId: string): Promise<string> {
    const parts: string[] = [];

    // Short-term: filesystem (.rip/<grave_id>/sessions/)
    const shortTerm = await readGraveShortTerm(graveId);
    if (shortTerm) {
      parts.push(`[Short-term Memory]\n${shortTerm}`);
    }

    // Long-term: SQLite
    const rows = await db
      .select({ content: memories.content })
      .from(memories)
      .where(eq(memories.grave_id, graveId));

    if (rows.length > 0) {
      const longTermText = rows.map((r) => r.content).join('\n');
      parts.push(`[Long-term Memory]\n${longTermText}`);
    }

    return parts.join('\n\n');
  }

  /**
   * Parse short-term memory files for this session.
   * Each file uses "Visitor: ...\nGhost: ..." format.
   * Convert to Message[] and keep only the last 10 turns.
   */
  async getConversationHistory(
    graveId: string,
    sessionId: string,
  ): Promise<Message[]> {
    const shortTerm = await readGraveShortTerm(graveId);
    if (!shortTerm) return [];

    // Extract only the section for the current session
    const sessionBlock = this.extractSessionBlock(shortTerm, sessionId);
    if (!sessionBlock) return [];

    const messages: Message[] = [];

    // Split into exchange pairs: each "Visitor:" ..."Ghost: ..." is a turn
    const exchanges = sessionBlock.split(/(?=Visitor:)/).filter(Boolean);

    for (const exchange of exchanges) {
      const visitorMatch = exchange.match(/^Visitor:\s*([\s\S]*?)(?=\nGhost:|$)/);
      const ghostMatch = exchange.match(/\nGhost:\s*([\s\S]*?)$/);

      if (visitorMatch) {
        messages.push({
          role: 'user',
          content: visitorMatch[1].trim(),
        });
      }

      if (ghostMatch) {
        messages.push({
          role: 'assistant',
          content: ghostMatch[1].trim(),
        });
      }
    }

    // Sliding window: keep only last 10 turns (20 messages max: 10 user + 10 assistant)
    const maxMessages = 20;
    if (messages.length > maxMessages) {
      return messages.slice(messages.length - maxMessages);
    }

    return messages;
  }

  /**
   * Save a user/assistant exchange as a short-term memory file.
   */
  async saveExchange(
    graveId: string,
    sessionId: string,
    userMsg: string,
    assistantReply: string,
  ): Promise<void> {
    const content = `Visitor: ${userMsg}\nGhost: ${assistantReply}`;
    await addMemory(graveId, sessionId, content);
  }

  // ── Private helpers ──────────────────────────────────────────

  /**
   * Extract the block for a specific session from the merged short-term text.
   * The format from readGraveShortTerm is:
   *   [session <session_id>]\n<contents>
   */
  private extractSessionBlock(
    shortTerm: string,
    sessionId: string,
  ): string | null {
    // Match "[session <sessionId>]" followed by content until the next
    // "[session ..." or end of string.
    const pattern = new RegExp(
      `\\[session ${this.escapeRegex(sessionId)}\\]\\n([\\s\\S]*?)(?=\\n\\[session |$)`,
    );
    const match = shortTerm.match(pattern);
    return match ? match[1].trim() : null;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
