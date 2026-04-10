/**
 * Grave CRUD operations using Drizzle ORM.
 *
 * Graves are the tombstones in the digital graveyard.
 * Each grave has a unique hex ID ('0x' + 8 chars) and a random 3D position.
 */

import { db, eq } from '../db/client';
import { graves } from '../db/schema';
import { generateGraveId } from '../types';

/** Inferred row type from the graves schema (Date for created_at). */
type GraveRow = typeof graves.$inferSelect;

// ── Helpers ────────────────────────────────────────────────

function randomPosition(): { x: number; y: number; z: number } {
  return {
    x: Math.round((Math.random() * 40 - 20) * 10) / 10,
    y: Math.round((Math.random() * 5 + 3) * 10) / 10, // 3..8
    z: Math.round((Math.random() * 40 - 20) * 10) / 10,
  };
}

// ── CRUD ────────────────────────────────────────────────────

export async function listGraves(): Promise<GraveRow[]> {
  return db.select().from(graves).all();
}

export async function getGrave(id: string): Promise<GraveRow | null> {
  const rows = await db.select().from(graves).where(eq(graves.id, id)).all();
  return rows[0] ?? null;
}

export async function createGrave(data: {
  name: string;
  epitaph: string;
  date: string;
}): Promise<GraveRow> {
  const id = generateGraveId();
  const pos = randomPosition();

  await db.insert(graves).values({
    id,
    name: data.name,
    epitaph: data.epitaph,
    date: data.date,
    position_x: pos.x,
    position_y: pos.y,
    position_z: pos.z,
  });

  const row = await getGrave(id);
  return row!;
}

/**
 * Ensure the default "Satoshi" grave exists.
 * Called on startup when the graves table is empty.
 */
export async function ensureDefaultGrave(): Promise<void> {
  const existing = await listGraves();
  if (existing.length > 0) return;

  await db.insert(graves).values({
    id: '0xDEADBEEF',
    name: 'Satoshi',
    epitaph: 'The genesis block remains eternal.',
    date: '2009-01-03',
    position_x: 0,
    position_y: 5,
    position_z: 0,
  });
}
