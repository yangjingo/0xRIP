/**
 * 0xRIP Backend — Bun.serve() entry point.
 *
 * Serves the REST API for the digital graveyard frontend.
 */

import { ensureDefaultGrave, listGraves, getGrave, createGrave } from './services/grave';
import { createSession, listSessions, endSession } from './services/session';
import {
  promoteSession,
  promoteAll,
  saveLongTermMemories,
  writeProfile,
} from './services/memory';
import { createGhostAgent } from './agent/loop';
import {
  ChatRequestSchema,
  CreateGraveRequestSchema,
  PromoteRequestSchema,
  GenerateImageRequestSchema,
  GenerateSpeechRequestSchema,
  GenerateVideoRequestSchema,
  rowToGrave,
} from './types';
import type { ChatResponse } from './types';
import { db, eq, and, isNull } from './db/client';
import { graves, sessions, memories } from './db/schema';
import { runMmx } from './services/mmx';

// ── Init ────────────────────────────────────────────────────

const agent = createGhostAgent();

// Ensure default grave exists on startup
ensureDefaultGrave().catch(console.error);

// ── Helpers ─────────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function error(message: string, status = 400): Response {
  return json({ detail: message }, status);
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

/** Collect short-term + long-term memories into a single text blob. */
async function collectMemories(graveId: string): Promise<string> {
  const parts: string[] = [];

  const { readGraveShortTerm } = await import('./services/memory');
  const short = await readGraveShortTerm(graveId);
  if (short) parts.push(`[短期记忆]\n${short}`);

  const longTerm = await db.select().from(memories).where(eq(memories.grave_id, graveId)).all();
  if (longTerm.length > 0) {
    parts.push('[长期记忆]\n' + longTerm.map((m) => `- ${m.content}`).join('\n'));
  }

  return parts.join('\n\n');
}

// ── Router ──────────────────────────────────────────────────

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  try {
    // ── Graves ───────────────────────────────────────────

    if (path === '/api/graves' && method === 'GET') {
      await ensureDefaultGrave();
      const rows = await listGraves();
      return json(rows.map(rowToGrave));
    }

    if (path === '/api/graves' && method === 'POST') {
      const body = await req.json();
      const parsed = CreateGraveRequestSchema.safeParse(body);
      if (!parsed.success) return error(parsed.error.message, 422);

      const row = await createGrave(parsed.data);
      await writeProfile(row.id, `# ${row.name}\n\n${row.epitaph}`);
      return json(rowToGrave(row));
    }

    // ── Sessions ─────────────────────────────────────────

    const sessionMatch = path.match(/^\/api\/summon\/([^/]+)\/session$/);
    if (sessionMatch && method === 'POST') {
      const graveId = sessionMatch[1];
      const grave = await getGrave(graveId);
      if (!grave) return error('Soul not found.', 404);

      const result = await createSession(graveId);
      return json(result);
    }

    const sessionsMatch = path.match(/^\/api\/summon\/([^/]+)\/sessions$/);
    if (sessionsMatch && method === 'GET') {
      const graveId = sessionsMatch[1];
      const grave = await getGrave(graveId);
      if (!grave) return error('Soul not found.', 404);

      const result = await listSessions(graveId);
      return json(result);
    }

    // ── Chat ─────────────────────────────────────────────

    const chatMatch = path.match(/^\/api\/summon\/([^/]+)\/chat$/);
    if (chatMatch && method === 'POST') {
      const graveId = chatMatch[1];
      const body = await req.json();
      const parsed = ChatRequestSchema.safeParse(body);
      if (!parsed.success) return error(parsed.error.message, 422);

      const grave = await getGrave(graveId);
      if (!grave) return error('Soul not found.', 404);

      let sessionId = parsed.data.session_id;

      // Auto-create session if none provided
      if (!sessionId) {
        const sess = await createSession(graveId);
        sessionId = sess.session_id;
      }

      try {
        const graveObj = rowToGrave(grave);
        const reply = await agent.chat(graveObj, sessionId, parsed.data.message);

        return json({
          reply,
          role: 'ghost',
          session_id: sessionId,
        } satisfies ChatResponse);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return json({
          reply: `...... (灵魂干扰: ${msg}) ......`,
          role: 'system',
          session_id: sessionId,
        } satisfies ChatResponse);
      }
    }

    // ── Requiem (music) ─────────────────────────────────

    const requiemMatch = path.match(/^\/api\/summon\/([^/]+)\/requiem$/);
    if (requiemMatch && method === 'POST') {
      const graveId = requiemMatch[1];
      const grave = await getGrave(graveId);
      if (!grave) return error('Soul not found.', 404);

      const name = grave.name;
      const epitaph = grave.epitaph;
      const lyrics = `[Intro]\nIn the void of 0xRIP...\n[Verse]\n${name} remains, ${epitaph}.\n[Chorus]\nData souls never die, they just fade away.`;

      const result = await runMmx([
        'music', 'generate',
        '--prompt', 'ambient, ethereal, cyber graveyard',
        '--lyrics', lyrics,
      ], { timeout: 120000 });

      // Try to parse as JSON, otherwise return raw
      try {
        return json(JSON.parse(result));
      } catch {
        return json({ data: { audio: result } });
      }
    }

    // ── Promote memories ─────────────────────────────────

    const promoteMatch = path.match(/^\/api\/summon\/([^/]+)\/promote$/);
    if (promoteMatch && method === 'POST') {
      const graveId = promoteMatch[1];
      const body = await req.json();
      const parsed = PromoteRequestSchema.safeParse(body);
      if (!parsed.success) return error(parsed.error.message, 422);

      const grave = await getGrave(graveId);
      if (!grave) return error('Soul not found.', 404);

      const sessionId = parsed.data.session_id;

      let items: Array<{ id: string; content: string }>;
      if (sessionId) {
        items = await promoteSession(graveId, sessionId);
        await endSession(graveId, sessionId);
      } else {
        items = await promoteAll(graveId);
        // End all open sessions
        const openSessions = await db.select().from(sessions).where(
          and(eq(sessions.grave_id, graveId), isNull(sessions.ended_at)),
        ).all();
        for (const s of openSessions) {
          await endSession(graveId, s.id);
        }
      }

      const saved = await saveLongTermMemories(graveId, sessionId ?? null, items);
      return json({ promoted: saved.length, memory_ids: saved });
    }

    // ── Generate: Image ─────────────────────────────────

    if (path === '/api/generate/image' && method === 'POST') {
      const body = await req.json();
      const parsed = GenerateImageRequestSchema.safeParse(body);
      if (!parsed.success) return error(parsed.error.message, 422);

      const args = [
        'image', 'generate',
        '--prompt', parsed.data.prompt,
        '--output', 'json',
      ];
      if (parsed.data.aspect_ratio) {
        args.push('--aspect-ratio', parsed.data.aspect_ratio);
      }

      const result = await runMmx(args, { json: true, timeout: 120000 });
      return json(result);
    }

    // ── Generate: Speech ─────────────────────────────────

    if (path === '/api/generate/speech' && method === 'POST') {
      const body = await req.json();
      const parsed = GenerateSpeechRequestSchema.safeParse(body);
      if (!parsed.success) return error(parsed.error.message, 422);

      const args = [
        'speech', 'synthesize',
        '--text', parsed.data.text,
        '--out', `speech_${Date.now()}.mp3`,
      ];
      if (parsed.data.voice) {
        args.push('--voice', parsed.data.voice);
      }

      const result = await runMmx(args, { timeout: 60000 });
      return json({ audio_url: result.trim() });
    }

    // ── Generate: Video ─────────────────────────────────

    if (path === '/api/generate/video' && method === 'POST') {
      const body = await req.json();
      const parsed = GenerateVideoRequestSchema.safeParse(body);
      if (!parsed.success) return error(parsed.error.message, 422);

      const result = await runMmx([
        'video', 'generate',
        '--prompt', parsed.data.prompt,
        '--async',
      ], { json: true, timeout: 30000 });

      return json(result);
    }

    const videoStatusMatch = path.match(/^\/api\/generate\/video\/([^/]+)$/);
    if (videoStatusMatch && method === 'GET') {
      const taskId = videoStatusMatch[1];
      const result = await runMmx([
        'video', 'task', 'get',
        '--task-id', taskId,
        '--output', 'json',
      ], { json: true });

      return json(result);
    }

    // ── 404 ──────────────────────────────────────────────

    return error('Not found', 404);

  } catch (err) {
    console.error('Unhandled error:', err);
    return error('Internal server error', 500);
  }
}

// ── Start server ────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '8000', 10);

Bun.serve({
  port: PORT,
  fetch: handleRequest,
});

console.log(`0xRIP backend running on http://localhost:${PORT}`);
