# Changelog

## v0.3.0 — 2026-05-23

### Merged
- Single project root: `src/server/` + `src/client/` under one `package.json`
- One `bun install`, two commands: `bun run dev` (API) + `bun run web` (frontend)
- All filenames lowercased: `scene.tsx`, `terminal.tsx`, `store.ts`, `sound.ts`

### Trimmed
- Removed 4 unused components (ChatView, SheikahPanel, BuryWizard, Timeline)
- Removed 22 outdated docs (Monument Valley UX, verbose API references, legacy TODOs)
- Removed 3 stale root files (run_dev.py, GEMINI.md, AGENTS.md)
- Skills cleaned to SKILL.md only (removed tools/prompts/docs subdirectories)
- Removed ESLint, unused assets, empty dirs

### Architecture
- Frontend: 10 source files (was 14)
- Backend: 18 source files
- Docs: 2 files (was 22)
- Single `Terminal.tsx` replaces 4 UI components

---

## v0.2.0 — 2026-05-22

### Theme
- Switched to pure monochrome ASCII terminal aesthetic (black `#000`, white `#fff`)
- JetBrains Mono everywhere, no serif, no colors, no shadows
- CRT scanline overlay removed

### Terminal
- `/` slash command palette with arrow-key navigation and autocomplete
- `/summon <id>` shows grave suggestions filtered by ID or name
- Ghost replies stream character-by-character via SSE
- Ambient drone audio on summon (Web Audio API), fades out on `/quit`
- Ora spinner during thinking state
- TTS playback of ghost replies via `mmx speech synthesize`
- Typing sound effects (key click, enter thock)

### Backend
- Full Grave CRUD (GET/PUT/DELETE `/api/graves/:id`)
- SSE streaming endpoint (`/api/summon/:id/chat/stream`)
- Skill loader (`services/skills.ts`) — scans `skills/` for SKILL.md frontmatter
- Skill persona injection into ghost system prompt
- Memory summarization (`generateSessionSummary`), capacity limit (500/grave)
- Profile read/write endpoints
- Database migration: `skill_type` column added to graves

### Fixes
- DB path: `join()` replaces fragile regex on Windows
- `ANTHROPIC_BASE_URL` override from system env (DeepSeek → MiniMax)
- mmx CLI installed and authenticated for TTS/image/music/video

---

## v0.1.0 — 2026-05-21

### Backend (TypeScript + Bun)
- Bun.serve() HTTP server with 19 REST endpoints
- GhostAgent: tool-use loop with MiniMax M2.7 (Anthropic-compatible endpoint)
- 5 mmx CLI tools: image, music, video, speech, vision
- ContextManager: memory injection + sliding window (10 turns)
- Dual memory: .rip/ filesystem (short-term) + SQLite (long-term)
- Drizzle ORM schema: graves, sessions, memories
- Zod runtime validation

### Frontend (React + R3F)
- 3D graveyard with dark monolith tombstones
- Floating ghost with white emissive glow
- Wireframe grid floor, Bloom post-processing
- CameraControls with smooth focus on grave selection
- SheikahPanel: bottom panel with grave list, details, actions
- ChatView: right sidebar ghost chat
- BuryWizard: 4-step burial modal
- Zustand global state
- Tailwind CSS

### Skills
- 13 persona skills imported from Claude Code collection
