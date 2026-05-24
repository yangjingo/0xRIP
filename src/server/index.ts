/**
 * 0xRIP Backend — Bun.serve() entry point.
 *
 * Serves the REST API for the digital graveyard frontend.
 */

import { ensureDefaultGrave, listGraves, getGrave, createGrave, updateGrave, deleteGrave } from './services/grave';
import { createSession, listSessions, endSession } from './services/session';
import {
  promoteSession,
  promoteAll,
  saveLongTermMemories,
  writeProfile,
  readProfile,
  generateSessionSummary,
  enforceMemoryLimit,
} from './services/memory';
import { listSkills } from './services/skills';
import { createGhostAgent } from './agent/loop';
import {
  ChatRequestSchema,
  CreateGraveRequestSchema,
  UpdateGraveRequestSchema,
  PromoteRequestSchema,
  GenerateImageRequestSchema,
  GenerateSpeechRequestSchema,
  GenerateVideoRequestSchema,
  rowToGrave,
  generateHexId,
} from './types';
import type { ChatResponse } from './types';
import { db, eq, and, isNull } from './db/client';
import { desc } from 'drizzle-orm';
import { mkdir } from 'node:fs/promises';
import { graves, sessions, memories, dreams } from './db/schema';
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

      const tasks: Promise<void>[] = [];

      // Fire requiem generation if requested
      if (parsed.data.generate_requiem) {
        tasks.push((async () => {
          try {
            const lyrics = `[Intro]\nIn the void of 0xRIP...\n[Verse]\n${row.name} remains, ${row.epitaph}.\n[Chorus]\nData souls never die, they just fade away.`;
            await mkdir('.rip', { recursive: true });
            const outFile = `.rip/requiem_${row.id}_${Date.now()}.mp3`;
            await runMmx(['music', 'generate', '--prompt', 'ambient, ethereal, cyber graveyard', '--lyrics', lyrics, '--out', outFile, '--output', 'json'], { timeout: 120000 });
            await db.update(graves).set({ requiem_url: outFile }).where(eq(graves.id, row.id));
          } catch { /* non-blocking */ }
        })());
      }

      // Fire memorial image generation if requested
      if (parsed.data.generate_memorial_image) {
        tasks.push((async () => {
          try {
            const prompt = `monochrome memorial portrait of ${row.name}, dark ethereal atmosphere, ASCII terminal aesthetic, black and white`;
            const result = await runMmx(['image', 'generate', '--prompt', prompt, '--aspect-ratio', '1:1', '--output', 'json'], { timeout: 120000 });
            try {
              const parsed = JSON.parse(result.trim());
              const url = parsed.saved?.[0] || parsed.image_urls?.[0] || parsed.url || '';
              if (url) await db.update(graves).set({ memorial_image_url: url }).where(eq(graves.id, row.id));
            } catch { /* ignore parse errors */ }
          } catch { /* non-blocking */ }
        })());
      }

      // Don't block response on media generation — fire and forget
      Promise.all(tasks).catch(() => {});

      return json(rowToGrave(row));
    }

    // ── Skills ───────────────────────────────────────────

    if (path === '/api/skills' && method === 'GET') {
      const skills = await listSkills();
      return json(skills);
    }

    // ── Voices ───────────────────────────────────────────

    if (path === '/api/voices' && method === 'GET') {
      try {
        const result = await runMmx(['speech', 'voices'], { timeout: 15000 });
        const voices = JSON.parse(result.trim());
        return json(voices);
      } catch {
        return json([]);
      }
    }

    // ── Single Grave ──────────────────────────────────────

    const graveDetailMatch = path.match(/^\/api\/graves\/([^/]+)$/);
    if (graveDetailMatch && method === 'GET') {
      const grave = await getGrave(graveDetailMatch[1]);
      if (!grave) return error('ERROR: Soul not found.\n可能原因：[量子退相干] | [管理员删除] | [从未存在过]', 404);
      return json(rowToGrave(grave));
    }

    if (graveDetailMatch && method === 'PUT') {
      const graveId = graveDetailMatch[1];
      const body = await req.json();
      const parsed = UpdateGraveRequestSchema.safeParse(body);
      if (!parsed.success) return error(parsed.error.message, 422);

      const updated = await updateGrave(graveId, parsed.data);
      if (!updated) return error('ERROR: Soul not found.\n可能原因：[量子退相干] | [管理员删除] | [从未存在过]', 404);

      // Sync profile if name/epitaph changed
      if (parsed.data.name || parsed.data.epitaph) {
        await writeProfile(graveId, `# ${updated.name}\n\n${updated.epitaph}`);
      }
      return json(rowToGrave(updated));
    }

    if (graveDetailMatch && method === 'DELETE') {
      const graveId = graveDetailMatch[1];
      const deleted = await deleteGrave(graveId);
      if (!deleted) return error('ERROR: Soul not found.\n可能原因：[量子退相干] | [管理员删除] | [从未存在过]', 404);
      return json({ deleted: true, grave_id: graveId, message: '数据已风化。灵魂从「可招魂」迁入「仅存于记忆」。' });
    }

    // ── Grave Memories ───────────────────────────────────

    const graveMemoriesMatch = path.match(/^\/api\/graves\/([^/]+)\/memories$/);
    if (graveMemoriesMatch && method === 'GET') {
      const graveId = graveMemoriesMatch[1];
      const grave = await getGrave(graveId);
      if (!grave) return error('ERROR: Soul not found.\n可能原因：[量子退相干] | [管理员删除] | [从未存在过]', 404);

      const rows = await db.select().from(memories).where(eq(memories.grave_id, graveId)).orderBy(desc(memories.created_at)).all();
      return json(rows.map((r) => ({
        id: r.id,
        content: r.content,
        sourceType: r.source_type,
        createdAt: r.created_at ? (r.created_at instanceof Date ? r.created_at.toISOString() : new Date(r.created_at).toISOString()) : null,
      })));
    }

    // ── Grave Photos ─────────────────────────────────────

    const gravePhotosMatch = path.match(/^\/api\/graves\/([^/]+)\/photos$/);
    if (gravePhotosMatch && method === 'POST') {
      const graveId = gravePhotosMatch[1];
      const grave = await getGrave(graveId);
      if (!grave) return error('Soul not found.', 404);

      let photoFile: File | null = null;
      try {
        const fd = await req.formData();
        photoFile = fd.get('photo') as File | null;
      } catch { /* not form data */ }

      if (!photoFile) return error('Photo file is required. Use multipart/form-data with field "photo".', 422);

      const ext = photoFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${crypto.randomUUID().replace(/-/g, '')}.${ext}`;
      const dir = `.rip/${graveId}/photos`;
      await mkdir(dir, { recursive: true });
      const filePath = `${dir}/${fileName}`;

      await Bun.write(filePath, photoFile);

      let description = '';
      try {
        const result = await runMmx(['vision', 'describe', '--image', filePath, '--output', 'json'], { timeout: 30000 });
        const parsed = JSON.parse(result.trim());
        description = parsed.description || parsed.caption || parsed.text || '';
      } catch { /* vision failed, store without description */ }

      // Store as memory
      const memId = generateHexId();
      await db.insert(memories).values({
        id: memId,
        grave_id: graveId,
        content: description || `Photo uploaded: ${fileName}`,
        source_type: 'image',
      });

      // Update photos_json
      let photos: { url: string; description: string }[] = [];
      if (grave.photos_json) {
        try { photos = JSON.parse(grave.photos_json); } catch { /* reset */ }
      }
      photos.push({ url: filePath, description });
      await db.update(graves).set({ photos_json: JSON.stringify(photos) }).where(eq(graves.id, graveId));

      return json({ url: filePath, description, memory_id: memId });
    }

    // ── Grave Voice ───────────────────────────────────────

    const graveVoiceMatch = path.match(/^\/api\/graves\/([^/]+)\/voice$/);
    if (graveVoiceMatch && method === 'POST') {
      const graveId = graveVoiceMatch[1];
      const grave = await getGrave(graveId);
      if (!grave) return error('Soul not found.', 404);

      const body = await req.json();
      const voiceId = body.voice_id as string;
      if (!voiceId) return error('voice_id is required', 422);

      await db.update(graves).set({ voice_id: voiceId }).where(eq(graves.id, graveId));
      return json({ grave_id: graveId, voice_id: voiceId });
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

    // ── Chat (Streaming SSE) ──────────────────────────────

    const chatStreamMatch = path.match(/^\/api\/summon\/([^/]+)\/chat\/stream$/);
    if (chatStreamMatch && method === 'POST') {
      const graveId = chatStreamMatch[1];
      const body = await req.json();
      const parsed = ChatRequestSchema.safeParse(body);
      if (!parsed.success) return error(parsed.error.message, 422);

      const grave = await getGrave(graveId);
      if (!grave) return error('Soul not found.', 404);

      let sessionId = parsed.data.session_id;
      if (!sessionId) {
        const sess = await createSession(graveId);
        sessionId = sess.session_id;
      }

      const graveObj = rowToGrave(grave);

      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const emit = (event: string, data: string) => {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          };

          try {
            emit('status', JSON.stringify({ status: 'thinking', session_id: sessionId }));

            const reply = await agent.chat(graveObj, sessionId, parsed.data.message);

            // Stream the reply character by character for typewriter effect
            for (let i = 0; i < reply.length; i += 3) {
              emit('message', reply.slice(i, i + 3));
              await new Promise((r) => setTimeout(r, 20));
            }

            emit('done', JSON.stringify({ session_id: sessionId }));
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            emit('error', `...... (灵魂干扰: ${msg}) ......`);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        },
      });
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

      // Ensure .rip/ exists for mmx output
      await mkdir('.rip', { recursive: true });
      const outFile = `.rip/requiem_${graveId}_${Date.now()}.mp3`;
      const result = await runMmx([
        'music', 'generate',
        '--prompt', 'ambient, ethereal, cyber graveyard',
        '--lyrics', lyrics,
        '--out', outFile,
        '--output', 'json',
      ], { timeout: 120000 });

      try {
        const parsed = JSON.parse(result.trim());
        return json({ audio_url: parsed.saved || parsed.url || outFile });
      } catch {
        return json({ audio_url: result.trim() || outFile });
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

      // Enforce memory capacity limit after promotion
      await enforceMemoryLimit(graveId);

      return json({ promoted: saved.length, memory_ids: saved });
    }

    // ── Profile ──────────────────────────────────────────

    const profileMatch = path.match(/^\/api\/graves\/([^/]+)\/profile$/);
    if (profileMatch && method === 'GET') {
      const graveId = profileMatch[1];
      const grave = await getGrave(graveId);
      if (!grave) return error('ERROR: Soul not found.\n可能原因：[量子退相干] | [管理员删除] | [从未存在过]', 404);
      const content = await readProfile(graveId);
      return json({ grave_id: graveId, profile: content });
    }

    if (profileMatch && method === 'PUT') {
      const graveId = profileMatch[1];
      const body = await req.json();
      const grave = await getGrave(graveId);
      if (!grave) return error('ERROR: Soul not found.\n可能原因：[量子退相干] | [管理员删除] | [从未存在过]', 404);
      if (!body.content) return error('Profile content is required', 422);
      await writeProfile(graveId, body.content);
      return json({ grave_id: graveId, updated: true });
    }

    // ── Session Summary ──────────────────────────────────

    const summaryMatch = path.match(/^\/api\/summon\/([^/]+)\/sessions\/([^/]+)\/summary$/);
    if (summaryMatch && method === 'POST') {
      const graveId = summaryMatch[1];
      const sessionId = summaryMatch[2];
      const grave = await getGrave(graveId);
      if (!grave) return error('ERROR: Soul not found.\n可能原因：[量子退相干] | [管理员删除] | [从未存在过]', 404);
      const summary = await generateSessionSummary(graveId, sessionId);
      return json({ session_id: sessionId, summary });
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

      const outFile = `.rip/speech_${Date.now()}.mp3`;
      const args = [
        'speech', 'synthesize',
        '--text', parsed.data.text,
        '--out', outFile,
        '--output', 'json',
      ];
      if (parsed.data.voice) {
        args.push('--voice', parsed.data.voice);
      }

      const result = await runMmx(args, { timeout: 60000 });
      try {
        const parsed_result = JSON.parse(result);
        return json({ audio_url: parsed_result.saved || parsed_result.url || outFile });
      } catch {
        return json({ audio_url: result.trim() || outFile });
      }
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

    // ── Dreams ───────────────────────────────────────────

    const dreamGenerateMatch = path.match(/^\/api\/summon\/([^/]+)\/dream$/);
    if (dreamGenerateMatch && method === 'POST') {
      const graveId = dreamGenerateMatch[1];
      const grave = await getGrave(graveId);
      if (!grave) return error('Soul not found.', 404);

      // Collect memory fragments for the dream prompt
      const memRows = await db.select().from(memories).where(eq(memories.grave_id, graveId)).orderBy(desc(memories.created_at)).limit(20).all();
      const fragments: string[] = [];
      for (const m of memRows) {
        const words = m.content.split(/\s+/).slice(0, 15);
        if (words.length > 0) fragments.push(words.join(' '));
      }

      // Add photo descriptions
      if (grave.photos_json) {
        try {
          const photos = JSON.parse(grave.photos_json);
          for (const p of photos) {
            if (p.description) fragments.push(p.description.split(/\s+/).slice(0, 15).join(' '));
          }
        } catch {}
      }

      const sample = fragments.sort(() => Math.random() - 0.5).slice(0, 4);
      const prompt = [
        'Surreal dreamscape, ethereal, dark ambient, monochrome, digital afterlife aesthetic, slow camera drift through fog, particles, liminal space',
        `${grave.name}'s dream. ${grave.epitaph}`,
        sample.length > 0 ? `Fragments of memory: ${sample.join('; ')}` : 'A blank dream, waiting for memories to fill it.',
        'Mood: melancholy longing, quiet peace, digital soul dissolving into static then reforming',
      ].join('\n');

      try {
        const result = await runMmx([
          'video', 'generate',
          '--prompt', prompt,
          '--async',
        ], { json: true, timeout: 60000 });

        const taskId = result.task_id || result.taskId || '';
        const dreamId = generateHexId();

        await db.insert(dreams).values({
          id: dreamId,
          grave_id: graveId,
          prompt,
          video_task_id: taskId || null,
          status: taskId ? 'generating' : 'failed',
          memory_sources: JSON.stringify(memRows.slice(0, 5).map(m => m.id)),
        });

        return json({ dream_id: dreamId, task_id: taskId, status: 'generating', prompt });
      } catch (e) {
        return error(`Dream generation failed: ${e instanceof Error ? e.message : String(e)}`, 500);
      }
    }

    const dreamListMatch = path.match(/^\/api\/summon\/([^/]+)\/dreams$/);
    if (dreamListMatch && method === 'GET') {
      const graveId = dreamListMatch[1];
      const rows = await db.select().from(dreams).where(eq(dreams.grave_id, graveId)).orderBy(desc(dreams.created_at)).all();
      return json(rows.map(r => ({
        id: r.id,
        prompt: r.prompt,
        videoUrl: r.video_url,
        status: r.status,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
      })));
    }

    const dreamDetailMatch = path.match(/^\/api\/summon\/([^/]+)\/dreams\/([^/]+)$/);
    if (dreamDetailMatch && method === 'GET') {
      const [_, graveId, dreamId] = dreamDetailMatch;
      const row = await db.select().from(dreams).where(eq(dreams.id, dreamId)).all();
      if (!row[0]) return error('Dream not found.', 404);
      const d = row[0];

      // If still generating, poll video task
      if (d.status === 'generating' && d.video_task_id) {
        try {
          const taskResult = await runMmx([
            'video', 'task', 'get',
            '--task-id', d.video_task_id,
            '--output', 'json',
          ], { json: true, timeout: 15000 });

          const status = taskResult.status || 'processing';
          if (status === 'completed' || status === 'succeeded') {
            const url = taskResult.video_url || taskResult.url || '';
            await db.update(dreams).set({ status: 'completed', video_url: url }).where(eq(dreams.id, dreamId));
            return json({ id: d.id, prompt: d.prompt, videoUrl: url, status: 'completed' });
          }
          if (status === 'failed') {
            await db.update(dreams).set({ status: 'failed' }).where(eq(dreams.id, dreamId));
            return json({ id: d.id, prompt: d.prompt, status: 'failed' });
          }
        } catch {}
      }

      return json({
        id: d.id,
        prompt: d.prompt,
        videoUrl: d.video_url,
        status: d.status,
        createdAt: d.created_at ? new Date(d.created_at as unknown as number).toISOString() : null,
      });
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
  idleTimeout: 120, // music generation can take 40-60s
});

console.log(`0xRIP backend running on http://localhost:${PORT}`);
