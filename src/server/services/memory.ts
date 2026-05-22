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

// import.meta.dir is .../src/server/services, .rip/ is at project root
export const RIP_DIR: string = join(import.meta.dir, '..', '..', '..', '.rip');

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

  // Update MEMORY.md index
  if (saved.length > 0) {
    await updateMemoryIndex(graveId);
  }

  return saved;
}

// ── Summarization ──────────────────────────────────────────

/**
 * Generate a simple session summary from the conversation exchanges.
 * Extracts key themes by counting frequent words.
 */
export async function generateSessionSummary(
  graveId: string,
  sessionId: string,
): Promise<string> {
  const shortTerm = await readGraveShortTerm(graveId);
  const sessionBlock = extractSessionBlockFromText(shortTerm, sessionId);

  if (!sessionBlock) return `Session ${sessionId} — no exchanges recorded.`;

  const lines = sessionBlock.split('\n').filter(Boolean);
  const visitorLines = lines.filter((l) => l.startsWith('Visitor:'));
  const ghostLines = lines.filter((l) => l.startsWith('Ghost:'));

  const turnCount = Math.min(visitorLines.length, ghostLines.length);
  const topics = extractTopics(sessionBlock);

  const summary = `## Session Summary
- Exchanges: ${turnCount}
- Key themes: ${topics.slice(0, 5).join(', ') || 'general conversation'}
- Duration: ${turnCount} turns`;

  // Write summary to session.md
  const sessDir = await ensureSessionDir(graveId, sessionId);
  const p = join(sessDir, 'session.md');
  let existing = '';
  try { existing = await readFile(p, 'utf-8'); } catch { /* new file */ }
  await writeFile(p, existing + '\n' + summary, 'utf-8');

  return summary;
}

function extractTopics(text: string): string[] {
  // Simple word frequency extraction for topic detection
  const words = text.toLowerCase()
    .replace(/visitor:|ghost:|[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .filter((w) => !['this', 'that', 'with', 'from', 'have', 'been', 'were', 'they', 'them', 'what', 'when', 'where', 'which', 'there', 'their', 'about', 'would', 'could', 'should'].includes(w));

  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([w]) => w);
}

function extractSessionBlockFromText(
  text: string,
  sessionId: string,
): string | null {
  const escaped = sessionId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `\\[session ${escaped}\\]\\n([\\s\\S]*?)(?=\\n\\[session |$)`,
  );
  const match = text.match(pattern);
  return match ? match[1].trim() : null;
}

// ── Memory Index ───────────────────────────────────────────

async function updateMemoryIndex(graveId: string): Promise<void> {
  const rows = await db
    .select({ content: memories.content, created_at: memories.created_at })
    .from(memories)
    .where(eq(memories.grave_id, graveId))
    .all();

  const lines = ['# Long-Term Memory Index', ''];
  for (const row of rows) {
    const date = row.created_at instanceof Date
      ? row.created_at.toISOString().slice(0, 10)
      : 'unknown';
    const preview = row.content.slice(0, 80).replace(/\n/g, ' ');
    lines.push(`- [${date}] ${preview}...`);
  }

  const d = graveDir(graveId);
  await mkdir(d, { recursive: true });
  await writeFile(join(d, 'MEMORY.md'), lines.join('\n'), 'utf-8');
}

// ── Capacity / Expiry ──────────────────────────────────────

const MAX_MEMORIES_PER_GRAVE = 500;

/**
 * Enforce memory capacity limit per grave.
 * Deletes the oldest memories when the limit is exceeded.
 */
export async function enforceMemoryLimit(graveId: string): Promise<number> {
  const rows = await db
    .select({ id: memories.id })
    .from(memories)
    .where(eq(memories.grave_id, graveId))
    .orderBy(memories.created_at)
    .all();

  if (rows.length <= MAX_MEMORIES_PER_GRAVE) return 0;

  const toDelete = rows.slice(0, rows.length - MAX_MEMORIES_PER_GRAVE);
  for (const row of toDelete) {
    await db.delete(memories).where(eq(memories.id, row.id));
  }

  return toDelete.length;
}
