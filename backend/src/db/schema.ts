import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// ── graves ──────────────────────────────────────────────────

export const graves = sqliteTable('graves', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  epitaph: text('epitaph').notNull(),
  date: text('date').notNull(),
  position_x: real('position_x').notNull().default(0),
  position_y: real('position_y').notNull().default(5),
  position_z: real('position_z').notNull().default(0),
  video_task_id: text('video_task_id'),
  video_url: text('video_url'),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ── sessions ────────────────────────────────────────────────

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  grave_id: text('grave_id').notNull().references(() => graves.id),
  started_at: integer('started_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  ended_at: integer('ended_at', { mode: 'timestamp' }),
});

// ── memories ────────────────────────────────────────────────

export const memories = sqliteTable('memories', {
  id: text('id').primaryKey(),
  grave_id: text('grave_id').notNull().references(() => graves.id),
  session_id: text('session_id').references(() => sessions.id),
  content: text('content').notNull(),
  source_type: text('source_type').notNull(), // 'promoted' | 'manual' | 'image'
  created_at: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});
