# CLAUDE.md

## Behavioral Guidelines

1. **Think before coding.** State assumptions. If confused, stop and ask.
2. **Simplicity first.** Minimum code. No abstractions for single-use. No speculation.
3. **Surgical changes.** Touch only what's needed. Match existing style. Clean up your own orphans.
4. **Goal-driven.** Define verify step for each change. Loop until verified.

---

## Project

**0xRIP** — digital graveyard. Bury memories, summon data souls via MiniMax M2.7, explore a 3D memorial world. Pure monochrome ASCII terminal aesthetic.

## Quick Start

```bash
bun install
bun run dev          # backend :8000
bun run web          # frontend :5173
npm install -g mmx-cli && mmx auth login --api-key <key>
```

## Architecture

```
src/server/                    # Bun (no build)
  index.ts                     Bun.serve() — 19 REST endpoints
  types.ts                     Zod schemas
  agent/loop.ts                GhostAgent — tool-use loop (MiniMax M2.7, max 5 iters)
  agent/context.ts             ContextManager — memory injection + sliding window
  agent/prompts/ghost.ts       System prompt (skill persona injection)
  agent/tools/                 5 mmx CLI wrappers
  db/                          Drizzle ORM + SQLite
  services/                    grave, session, memory, mmx, skills

src/client/                    # React (Vite)
  app.tsx                      Canvas + brand overlay
  main.tsx                     Entry
  store/store.ts               Zustand
  hooks/sound.ts               Audio (clicks, ambient drone, TTS)
  hooks/suggestions.ts         Command autocomplete
  components/canvas/scene.tsx  R3F scene + Terminal (Html, transform)
  components/canvas/grave.tsx  3D tombstone
  components/canvas/ghost.tsx  3D floating ghost
  components/ui/terminal.tsx   Single CLI — /slash, SSE streaming, ambient

skills/                        12 persona SKILL.md files
docs/api/                      API reference
docs/story/                    Product definition
```

## Visual

Pure monochrome. Black `#000`, white `#fff`, dim `#888`. JetBrains Mono everywhere. No serif, no colors, no shadows. Single terminal — no panels, cards, or modals.

## Interaction

Terminal in 3D scene at grave position. `/` for command palette with arrow-key nav.
- `/list` `/bury` `/summon <id>` `/help` `/clear` `/quit`
- Click tombstone → camera focus → terminal appears. Ghost replies stream via SSE.
