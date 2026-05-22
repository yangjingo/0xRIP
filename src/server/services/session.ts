/**
 * Session management.
 *
 * A session represents one conversation between a visitor and a grave's ghost.
 * Sessions are tracked in SQLite via the sessions table.
 */

import { db, eq, and, isNull } from '../db/client';
import { sql } from 'drizzle-orm';
import { sessions, memories } from '../db/schema';
import type { SessionInfo } from '../types';
import { generateHexId } from '../types';

// ── ID Generation ──────────────────────────────────────────

/** Generate a new session ID (32-char hex, same format as uuid4 hex). */
export function newSessionId(): string {
  return generateHexId();
}

// ── CRUD ────────────────────────────────────────────────────

export async function createSession(
  graveId: string,
): Promise<{ session_id: string; grave_id: string }> {
  const sessionId = newSessionId();

  await db.insert(sessions).values({
    id: sessionId,
    grave_id: graveId,
  });

  return { session_id: sessionId, grave_id: graveId };
}

export async function listSessions(
  graveId: string,
): Promise<SessionInfo[]> {
  const rows = await db
    .select({
      id: sessions.id,
      grave_id: sessions.grave_id,
      started_at: sessions.started_at,
      ended_at: sessions.ended_at,
    })
    .from(sessions)
    .where(eq(sessions.grave_id, graveId))
    .all();

  // Count memories per session in a single query for efficiency.
  const counts = await db
    .select({
      session_id: memories.session_id,
      count: sql<number>`count(*)`.as('count'),
    })
    .from(memories)
    .where(eq(memories.grave_id, graveId))
    .groupBy(memories.session_id)
    .all();

  const countMap = new Map<string, number>();
  for (const c of counts) {
    if (c.session_id) countMap.set(c.session_id, c.count);
  }

  return rows.map((row) => ({
    id: row.id,
    grave_id: row.grave_id,
    started_at: row.started_at && !isNaN(row.started_at.getTime()) ? row.started_at.toISOString() : null,
    ended_at: row.ended_at && !isNaN(row.ended_at.getTime()) ? row.ended_at.toISOString() : null,
    memory_count: countMap.get(row.id) ?? 0,
  }));
}

export async function endSession(
  graveId: string,
  sessionId: string,
): Promise<void> {
  await db
    .update(sessions)
    .set({ ended_at: new Date() })
    .where(and(eq(sessions.id, sessionId), eq(sessions.grave_id, graveId)));
}
