/**
 * Skill loader for 0xRIP.
 *
 * Scans backend/skills/ for SKILL.md files and extracts
 * frontmatter metadata. Used by the burial wizard (skill type selector)
 * and the ghost agent (persona routing).
 */

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

export interface SkillMeta {
  slug: string;
  name: string;
  description: string;
  version: string;
  userInvocable: boolean;
  /** Human-readable category for the burial wizard. */
  category: string;
  /** Relationship type: human, ai, self */
  relationType: 'human' | 'ai' | 'self';
}

// ── Path ───────────────────────────────────────────────────

const SKILLS_DIR = join(import.meta.dir, '..', '..', '..', 'skills');

// ── Category mapping ───────────────────────────────────────

const CATEGORY_MAP: Record<string, { category: string; relationType: 'human' | 'ai' | 'self' }> = {
  colleague: { category: 'Colleague / 同事', relationType: 'human' },
  boss: { category: 'Boss / 老板', relationType: 'human' },
  ex: { category: 'Ex / 前任', relationType: 'human' },
  crush: { category: 'Crush / 暗恋', relationType: 'human' },
  parents: { category: 'Parents / 父母', relationType: 'human' },
  supervisor: { category: 'Supervisor / 导师', relationType: 'human' },
  senpai: { category: 'Senpai / 前辈', relationType: 'human' },
  reunion: { category: 'Reunion / 重逢', relationType: 'human' },
  yourself: { category: 'Yourself / 自己', relationType: 'self' },
  'digital-life': { category: 'Digital Life / 数字人生', relationType: 'self' },
  immortal: { category: 'Immortal / 永生', relationType: 'ai' },
  pua: { category: 'PUA / 压力驱动', relationType: 'ai' },
  nopua: { category: 'NoPUA / 反PUA', relationType: 'ai' },
};

// ── Frontmatter parser ─────────────────────────────────────

function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };

  const data: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^([\w-]+):\s*(.+)$/);
    if (kv) data[kv[1]] = kv[2].trim();
  }

  return { data, body: match[2] };
}

// ── Skill list ─────────────────────────────────────────────

let cachedSkills: SkillMeta[] | null = null;

export async function listSkills(): Promise<SkillMeta[]> {
  if (cachedSkills) return cachedSkills;

  const entries = await readdir(SKILLS_DIR, { withFileTypes: true });
  const skills: SkillMeta[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const slug = entry.name;

    let raw: string;
    try {
      raw = await readFile(join(SKILLS_DIR, slug, 'SKILL.md'), 'utf-8');
    } catch {
      continue; // No SKILL.md — skip
    }

    const { data } = parseFrontmatter(raw);
    const mapping = CATEGORY_MAP[slug] ?? { category: slug, relationType: 'human' as const };

    skills.push({
      slug,
      name: data.name ?? slug,
      description: data.description ?? '',
      version: data.version ?? '0.0.0',
      userInvocable: data['user-invocable'] === 'true',
      category: mapping.category,
      relationType: mapping.relationType,
    });
  }

  cachedSkills = skills;
  return skills;
}

/**
 * Get a single skill's full SKILL.md body (without frontmatter)
 * for use as persona context.
 */
export async function getSkillBody(slug: string): Promise<string | null> {
  let raw: string;
  try {
    raw = await readFile(join(SKILLS_DIR, slug, 'SKILL.md'), 'utf-8');
  } catch {
    return null;
  }
  const { body } = parseFrontmatter(raw);
  return body.trim() || null;
}

/**
 * Clear the skill cache (useful during development).
 */
export function clearSkillCache(): void {
  cachedSkills = null;
}
