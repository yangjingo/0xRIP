import { z } from 'zod';

// ── Database Row Types ──────────────────────────────────────

export interface GraveRow {
  id: string;
  name: string;
  epitaph: string;
  date: string;
  position_x: number;
  position_y: number;
  position_z: number;
  video_task_id: string | null;
  video_url: string | null;
  created_at: number; // Unix timestamp (ms)
}

export interface SessionRow {
  id: string;
  grave_id: string;
  started_at: number; // Unix timestamp (ms)
  ended_at: number | null;
}

export interface MemoryRow {
  id: string;
  grave_id: string;
  session_id: string | null;
  content: string;
  source_type: 'promoted' | 'manual' | 'image';
  created_at: number; // Unix timestamp (ms)
}

// ── Insert Types (omit auto-generated fields) ───────────────

export type NewGrave = Omit<GraveRow, 'created_at'> & { created_at?: number };
export type NewSession = Omit<SessionRow, 'started_at' | 'ended_at'> & { started_at?: number; ended_at?: number | null };
export type NewMemory = Omit<MemoryRow, 'created_at'> & { created_at?: number };

// ── Frontend-Facing Types ───────────────────────────────────

export interface Grave {
  id: string;        // '0x' + 8-char hex
  name: string;
  epitaph: string;
  date: string;
  position: [number, number, number];
  videoUrl?: string;
  videoStatus?: 'none' | 'processing' | 'completed' | 'failed';
}

export interface Message {
  id: string;
  role: 'user' | 'ghost' | 'system';
  content: string;
}

export interface SessionInfo {
  id: string;
  grave_id: string;
  started_at: string | null; // ISO 8601
  ended_at: string | null;   // ISO 8601
  memory_count: number;
}

// ── API Request Types ───────────────────────────────────────

export interface ChatRequest {
  message: string;
  session_id?: string;
}

export interface ChatResponse {
  reply: string;
  role: string;
  session_id: string;
}

export interface CreateGraveRequest {
  name: string;
  epitaph: string;
  date: string;
}

export interface PromoteRequest {
  session_id?: string;
}

export interface GenerateImageRequest {
  prompt: string;
  aspect_ratio?: string;
}

export interface GenerateSpeechRequest {
  text: string;
  voice?: string;
}

export interface GenerateVideoRequest {
  prompt: string;
}

// ── Zod Runtime Validation Schemas ─────────────────────────

export const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  session_id: z.string().optional(),
});

export const CreateGraveRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  epitaph: z.string().min(1, 'Epitaph is required').max(500),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
});

export const PromoteRequestSchema = z.object({
  session_id: z.string().optional(),
});

export const GenerateImageRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  aspect_ratio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4']).optional(),
});

export const GenerateSpeechRequestSchema = z.object({
  text: z.string().min(1, 'Text is required').max(5000),
  voice: z.string().optional(),
});

export const GenerateVideoRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(2000),
});

// ── Helpers ─────────────────────────────────────────────────

/** Generate a grave ID: '0x' + 8 lowercase hex chars. */
export function generateGraveId(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return '0x' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/** Generate a session/memory ID: 32 lowercase hex chars (uuid4 hex). */
export function generateHexId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/** Current time as Unix timestamp in milliseconds. */
export function nowMs(): number {
  return Date.now();
}

/** Convert a DB row (from Drizzle) to the frontend-facing Grave type. */
export function rowToGrave(row: { id: string; name: string; epitaph: string; date: string; position_x: number; position_y: number; position_z: number; video_task_id: string | null; video_url: string | null }): Grave {
  return {
    id: row.id,
    name: row.name,
    epitaph: row.epitaph,
    date: row.date,
    position: [row.position_x, row.position_y, row.position_z],
    videoUrl: row.video_url ?? undefined,
    videoStatus: row.video_task_id
      ? row.video_url
        ? 'completed'
        : 'processing'
      : 'none',
  };
}
