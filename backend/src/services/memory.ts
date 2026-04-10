/**
 * Memory operations for 0xRIP.
 *
 * Short-term memories live on the filesystem under .rip/<grave_id>/sessions/.
 * Long-term memories live in SQLite (promoted from short-term).
 *
 * Directory layout:
 *   .rip/
 *     <grave_id>/
 *       profile.md           Grave identity
 *       MEMORY.md             Long-term memory index
 *       sessions/
 *         <session_id>/
 *           session.md        Session summary
 *           memories/
 *             <uuid>.md       Short-term memory files
 */

import { mkdir, readFile, writeFile, unlink, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { db, eq, and } from '../db/client';
import { sessions, memories } from '../db/schema';
import { generateHexId } from '../types';

// ── Path constants ─────────────────────────────────────────

// import.meta.dir is .../backend/src/services
// project root is .../backend, and .rip/ is at .../backend/.rip/
export const RIP_DIR: string = join(import.meta.dir, '..', '..', '.rip');

// ── Path helpers ───────────────────────────────────────────

function graveDir(graveId: string): string {
  const d = join(RIP_DIR, graveId);
  return d;
}

async function ensureGraveDir(graveId: string): Promise<string> {
  const d = graveDir(graveId);
  await mkdir(join(d, 'sessions'), { recursive: true });
  return d;
}

async function ensureSessionDir(
  graveId: string,
  sessionId: string,
): Promise<string> {
  const d = join(RIP_DIR, graveId, 'sessions', sessionId, 'memories');
  await mkdir(d, { recursive: true });
  return join(RIP_DIR, graveId, 'sessions', sessionId);
}

function sessionMemoriesDir(graveId: string, sessionId: string): string {
  return join(RIP_DIR, graveId, 'sessions', sessionId, 'memories');
}

// ── Profile ────────────────────────────────────────────────

export async function readProfile(graveId: string): Promise<string> {
  const p = join(graveDir(graveId), 'profile.md');
  try {
    return await readFile(p, 'utf-8');
  } catch {
    return '';
  }
}

export async function writeProfile(
  graveId: string,
  content: string,
): Promise<void> {
  await ensureGraveDir(graveId);
  const p = join(graveDir(graveId), 'profile.md');
  await writeFile(p, content, 'utf-8');
}

// ── Short-term memory (.rip/ filesystem) ───────────────────

/**
 * Add a short-term memory file to a session.
 * Returns the memory ID (uuid hex).
 */
export async function addMemory(
  graveId: string,
  sessionId: string,
  content: string,
): Promise<string> {
  const memId = generateHexId();
  const sessDir = await ensureSessionDir(graveId, sessionId);
  const p = join(sessDir, 'memories', `${memId}.md`);
  await writeFile(p, content, 'utf-8');
  return memId;
}

/**
 * Read ALL short-term memories across all sessions for a grave.
 * Returns merged text with session headers.
 */
export async function readGraveShortTerm(graveId: string): Promise<string> {
  const sessDir = join(RIP_DIR, graveId, 'sessions');
  let entries: string[];
  try {
    entries = await readdir(sessDir);
  } catch {
    return '';
  }

  const parts: string[] = [];

  for (const entry of [...entries].sort()) {
    const memDir = join(sessDir, entry, 'memories');
    let files: string[];
    try {
      files = await readdir(memDir);
    } catch {
      continue;
    }

    const mdFiles = files.filter((f) => f.endsWith('.md')).sort();
    if (mdFiles.length === 0) continue;

    const contents: string[] = [];
    for (const f of mdFiles) {
      contents.push(await readFile(join(memDir, f), 'utf-8'));
    }
    parts.push(`[session ${entry}]\n${contents.join('\n')}`);
  }

  return parts.join('\n\n');
}

/**
 * Promote a single session's short-term memories.
 * Reads all .md files from the session's memories/ directory,
 * deletes them, and closes the session.
 * Returns array of { id, content } for DB insertion.
 */
export async function promoteSession(
  graveId: string,
  sessionId: string,
): Promise<Array<{ id: string; content: string }>> {
  const memDir = sessionMemoriesDir(graveId, sessionId);
  let files: string[];
  try {
    files = await readdir(memDir);
  } catch {
    return [];
  }

  const mdFiles = files.filter((f) => f.endsWith('.md')).sort();
  const result: Array<{ id: string; content: string }> = [];

  for (const f of mdFiles) {
    const filePath = join(memDir, f);
    const content = await readFile(filePath, 'utf-8');
    result.push({ id: f.replace(/\.md$/, ''), content });
    await unlink(filePath);
  }

  await closeSessionFs(graveId, sessionId);
  return result;
}

/**
 * Promote ALL sessions' short-term memories for a grave.
 * Returns array of { id, content } for DB insertion.
 */
export async function promoteAll(
  graveId: string,
): Promise<Array<{ id: string; content: string }>> {
  const sessDir = join(RIP_DIR, graveId, 'sessions');
  let entries: string[];
  try {
    entries = await readdir(sessDir);
  } catch {
    return [];
  }

  const allMemories: Array<{ id: string; content: string }> = [];

  for (const entry of [...entries].sort()) {
    const memDir = join(sessDir, entry, 'memories');
    let files: string[];
    try {
      files = await readdir(memDir);
    } catch {
      continue;
    }

    const mdFiles = files.filter((f) => f.endsWith('.md')).sort();
    for (const f of mdFiles) {
      const filePath = join(memDir, f);
      const content = await readFile(filePath, 'utf-8');
      allMemories.push({ id: f.replace(/\.md$/, ''), content });
      await unlink(filePath);
    }

    await closeSessionFs(graveId, entry);
  }

  return allMemories;
}

/**
 * Append a closing timestamp to the session's session.md file.
 */
export async function closeSessionFs(
  graveId: string,
  sessionId: string,
): Promise<void> {
  const sessDir = await ensureSessionDir(graveId, sessionId);
  const p = join(sessDir, 'session.md');
  let existing = '';
  try {
    existing = await readFile(p, 'utf-8');
  } catch {
    // File does not exist yet — that is fine.
  }
  const stamp = new Date().toISOString();
  await writeFile(p, `${existing}\n\n--- session closed ${stamp} ---\n`, 'utf-8');
}

// ── Long-term memory (SQLite via Drizzle) ──────────────────

/**
 * Save promoted memories to the long-term SQLite store.
 * Returns the IDs of the inserted memories.
 */
export async function saveLongTermMemories(
  graveId: string,
  sessionId: string | null,
  items: Array<{ id: string; content: string }>,
): Promise<string[]> {
  const saved: string[] = [];

  for (const item of items) {
    await db.insert(memories).values({
      id: item.id,
      grave_id: graveId,
      session_id: sessionId,
      content: item.content,
      source_type: 'promoted',
    });
    saved.push(item.id);
  }

  return saved;
}
