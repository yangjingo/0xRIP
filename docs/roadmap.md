# 0xRIP Roadmap

Last updated: 2026-05-24

---

## Core (shipped)

### Text Chat

- [x] SSE streaming chat via MiniMax M2.7 (Anthropic-compatible endpoint)
- [x] GhostAgent tool-use loop — max 5 iterations, 4096 max tokens
- [x] ContextManager: system prompt + conversation history (sliding window 10 turns) + memory injection
- [x] Memory: short-term (`.rip/<id>/sessions/*.md`) + long-term (SQLite, 500 cap, `source_type`: promoted/manual/image/vision)
- [x] `/summon <id> [msg]` — open channel, optional inline message
- [x] `/quit` — close channel, stop ambient + requiem
- [x] 12 skill personas scan at runtime, injected into ghost system prompt

### Media Generation (mmx CLI)

- [x] `generate_image` — `mmx image generate --prompt ... --aspect-ratio ... --output json`
- [x] `generate_music` — `mmx music generate --prompt ... [--lyrics ...] [--instrumental]`
- [x] `synthesize_speech` — `mmx speech synthesize --text ... --voice ... --out ...`
- [x] `analyze_image` — `mmx vision describe --image ... --output json`
- [x] `generate_video` — `mmx video generate --prompt ... --async`
- [x] `POST /api/summon/:id/requiem` — music from name + epitaph
- [x] `POST /api/generate/image` — direct image generation
- [x] `POST /api/generate/speech` — direct TTS with optional voice
- [x] `POST /api/generate/video` + `GET /api/generate/video/:taskId` — async video

### 3D Graveyard

- [x] R3F scene: black background, exponential fog, ambient + directional light with shadows, Bloom post-processing
- [x] Floor grid (40x40, 2-unit spacing) + dark platform
- [x] Grave geometry: dark slab + octagonal cap + wireframe (bright white when selected)
- [x] Selection ring at base, click to select
- [x] CameraControls: orbit, zoom 15-200, polar angle clamp, smooth lookAt animation on select
- [x] Camera: default [50, 70, 50] FOV 35 — shows all graves on entry

### Terminal UI

- [x] Single component CLI — `>` prompt, `/` triggers command palette
- [x] Three modes: cmd / bury / chat — each with own prompt and behavior
- [x] Command autocomplete: filter by prefix, arrow-key nav, Tab complete, Esc dismiss
- [x] Line types: system (· dim), input (▸ gray), output (plain), ghost (◇ white italic), error (✕ red)
- [x] Header bar: mode label + hint text (hidden in welcome mode for transparency)
- [x] Welcome mode: transparent background floating over 3D scene
- [x] Chat mode: dark panel background, ora spinner while thinking, voice waveform while speaking
- [x] Scroll indicator: "↓ new messages below" when scrolled up, click to jump back
- [x] Click grave → terminal shows selection info + summon hint

### Audio

- [x] `playEnter()` — 60ms noise burst, lowpass 600Hz
- [x] `startAmbient()` / `stopAmbient()` — 4 detuned sine oscillators (55/82.4/110/220Hz) + noise texture, 2s fade in/out
- [x] `speak(text, voice?, cb)` — POST speech API, Audio playback, speaking state callback
- [x] `startRequiem(url)` / `stopRequiem()` — looped Audio element, volume 0.3

### DB

- [x] SQLite via Drizzle ORM + Bun, WAL mode, foreign keys on
- [x] `graves`: id, name, epitaph, date, skill_type, position_x/y/z, video_task_id, video_url, voice_id, requiem_url, memorial_image_url, photos_json, created_at
- [x] `sessions`: id, grave_id, started_at, ended_at
- [x] `memories`: id, grave_id, session_id, content, source_type, created_at
- [x] `dreams`: id, grave_id, prompt, video_task_id, video_url, status, memory_sources, created_at
- [x] Auto-migration: `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE ADD COLUMN` wrapped in try/catch

### Endpoints (19 total)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/graves` | List all graves |
| POST | `/api/graves` | Create grave (with optional voice_id, generate_requiem, generate_memorial_image) |
| GET | `/api/graves/:id` | Get single grave |
| PUT | `/api/graves/:id` | Update grave name/epitaph/date |
| DELETE | `/api/graves/:id` | Delete grave + cascade |
| GET | `/api/graves/:id/memories` | List long-term memories |
| GET | `/api/graves/:id/profile` | Read profile.md |
| PUT | `/api/graves/:id/profile` | Write profile.md |
| POST | `/api/graves/:id/photos` | Upload photo → vision describe → memory |
| POST | `/api/graves/:id/voice` | Set voice_id |
| GET | `/api/skills` | List skill personas |
| GET | `/api/voices` | List 200+ system voices |
| POST | `/api/summon/:id/session` | Create chat session |
| GET | `/api/summon/:id/sessions` | List sessions |
| POST | `/api/summon/:id/chat` | Chat (JSON response) |
| POST | `/api/summon/:id/chat/stream` | Chat (SSE streaming) |
| POST | `/api/summon/:id/requiem` | Generate requiem music |
| POST | `/api/summon/:id/promote` | Promote short-term → long-term memories |
| POST | `/api/summon/:id/sessions/:sid/summary` | Generate session summary |
| POST | `/api/summon/:id/dream` | Generate dream video from memories |
| GET | `/api/summon/:id/dreams` | List dreams |
| GET | `/api/summon/:id/dreams/:dream_id` | Get dream status (polls video task) |
| POST | `/api/generate/image` | Generate image |
| POST | `/api/generate/speech` | Generate speech (TTS) |
| POST | `/api/generate/video` | Generate video (async) |
| GET | `/api/generate/video/:taskId` | Check video task status |

---

## In Progress

### Voice Clone

- [ ] `POST /api/graves/:id/voice-clone` — upload 10s audio sample
  - Save to `.rip/<id>/voice_sample.mp3`
  - Call MiniMax REST API: `POST /v1/files/upload` → `voice_clone` with file_id + custom voice_id
  - Store returned voice_id in graves table
  - Alternative: MiniMax Voice Design (July 2025) — generate voice from text prompt (epitaph), no audio needed
- [ ] Frontend: `VOICE? [record 10s]` step during `/bury`
  - `navigator.mediaDevices.getUserMedia({ audio: true })` + `MediaRecorder`
  - Show recording indicator with duration timer
  - Upload to `/api/graves/:id/voice-clone` after grave creation

### MOURN

- [ ] `/mourn <id>` command
  - Validate grave exists
  - Camera: smooth orbit around grave (2 full circles, 8s duration)
  - Music: `mmx music generate --prompt "melancholic elegy, quiet grief" --instrumental --out .rip/<id>/elegy_<ts>.mp3`
  - Image: `mmx image generate --prompt "single white flower on a dark grave, monochrome" --aspect-ratio "1:1"`
  - Store: flower image URL in memories (source_type='mourn_flower'), elegy URL in memories (source_type='mourn_elegy')
  - Note: text note stored as memory (source_type='mourn_note')
  - Terminal: show "MOURNING..." with spinner, then display flower image URL + elegy URL

### DECAY

- [ ] `/decay <id>` command
  - Confirm: "This is irreversible. Type the grave ID to confirm:"
  - If confirmed:
    - Delete all generated media files (requiem mp3, memorial image, photos, voice sample)
    - Set `requiem_url = NULL`, `memorial_image_url = NULL`, `voice_id = NULL`, `photos_json = NULL`
    - Preserve text memories (profile.md, long-term SQLite memories)
    - Generate one final requiem: `mmx music generate --prompt "final farewell, fading to silence" --instrumental`
    - Play final requiem, then fade out ambient
    - Grave wireframe turns from white to gray (decayed visual state)
    - Terminal: "0xDEADBEEF has decayed. Text memorial remains."
  - Frontend: add `decayed` boolean to Grave type, show `[decayed]` in `/list`

### Ghost-Initiated Tool Use

- [ ] Ghost can call `generate_image` without explicit user request
  - System prompt update: "You may occasionally generate an image when a memory or feeling is so strong it demands to be seen, even unasked."
  - Ghost decides when, what, and shares the image URL in conversation
- [ ] Ghost can call `generate_music` unsolicited
  - "When silence feels too heavy, you may compose a short piece to fill it."
- [ ] Ghost references burial photo memories proactively
  - System prompt already injects photo descriptions. Ghost should mention them naturally: "That photo you left — the one with the rain — I still see it."

### Video Memorial

- [ ] `POST /api/summon/:id/memorial-video`
  - Compile all grave inputs into a video prompt:
    ```
    "A memorial for {name}. {epitaph}.
     Photos show: {photo_descriptions}.
     Memories include: {3 random memory excerpts}.
     Style: ethereal, monochrome, digital afterlife, slow dissolves, 60 seconds."
    ```
  - Call `mmx video generate --prompt ... --async`
  - Store video_task_id in graves table
- [ ] Frontend: `/memorial <id>` — check status, display video URL when complete
- [ ] Option to generate on `/bury` completion (like requiem/memorial image)

### Auto-Dream at Midnight

- [ ] `setInterval` in backend, fires at 00:00 local time
- [ ] For each grave with >10 memories: trigger dream generation
- [ ] New dreams appear in `/dreams <id>` next morning
- [ ] Optional: add "Last night's dreams" section to welcome message

### UI Fixes & Polish

- [ ] `grave.tsx` — fix `date` prop missing in Grave type (pre-existing TS error)
- [ ] `app.tsx` — fix `shadowMapType` prop on GLProps (pre-existing TS error)
- [ ] `/list` — render small preview image for graves with memorial_image_url
- [ ] `/summon` — show photo thumbnails next to ghost's reference to them
- [ ] Terminal responsive: scale down on smaller viewports
- [ ] Keyboard shortcut: `Ctrl+L` = `/clear`

---

## Planned

### Social Graveyard — Auto-Interaction Engine

- [ ] `SocialEngine` class in `src/server/services/social.ts`
  - `start(intervalMinutes: number)` — setInterval tick
  - `tick()` — per-cycle logic
  - `stop()` — cleanup
- [ ] Tick algorithm:
  1. Load all graves from DB (require skill_type for persona)
  2. Shuffle, pair into couples
  3. For each pair:
     - Build system prompts for both souls (persona + memories + photo context)
     - Seed conversation: "Soul A visits Soul B's grave. The night is quiet. Speak."
     - Dual-agent loop: Soul A → Soul B → Soul A → ... (5 turns each)
     - Save exchange as shared memory for both graves (source_type='social')
     - 10% chance either soul generates an image or music as a gift
  4. Rate limit: max 3 pairings per tick, random selection
  5. Token budget: 4096 per soul per conversation
- [ ] Bond score system
  - `.rip/<id>/social/bonds.json` — `{ [other_id]: { score: 0.0-1.0, last_interaction: timestamp, shared_memories: [id...] } }`
  - Score increment: +0.05 per conversation, decay -0.01 per day without interaction
  - Tiers: Stranger (0-0.1), Acquaintance (0.1-0.3), Familiar (0.3-0.6), Bound (0.6-0.9), Eternally Linked (0.9-1.0)
- [ ] Gifts
  - Soul generates image/music FOR the other soul
  - Saved to `.rip/<id>/social/gifts/`
  - Referenced in future conversations: "I made this for you."
- [ ] Decay as social drift
  - When a soul decays, all bonds weaken by 50%
  - Connected souls generate mourning memory (elegy from lost soul's epitaph)
  - Ghost references: "I haven't heard from 0x4A2F... their signal is growing faint."
- [ ] `/social` command — display bond graph as ASCII art in terminal
  ```
  [37m0xDEADBEEF ──── 0x13F29F2E  [Familiar 0.45]
  │                │
  │                └── 0xAABBCCDD  [Acquaintance 0.18]
  └── 0x12345678  [Bound 0.72]
  ```

### Visitor Witnesses

- [ ] Ghost references other souls during human summon
  - System prompt injected with recent social interactions
  - "Last night, {other_name} was here. They said you would come."
  - "I showed {other_name} a memory of rain. They composed a melody for me."

---

## Future Ideas

| Idea | One-liner |
|------|-----------|
| GHOST MATURITY | New souls are fragmented; coherence grows with each conversation (natural side-effect of longer context) |
| ANNIVERSARY | On burial date: bloom intensity up, special requiem auto-plays, ghost is more present |
| FORGETTING | Unvisited >30 days → memory summaries compress. Ghost becomes vaguer over time |
| SEANCE | Multiple visitors in one chat session. Ghost addresses each by name |
| CONFESSION | Whisper mode — messages encrypted, never stored. Ghost hears but forgets |
| ECHO | Replay past conversation in cloned voice via TTS |
| MERGE | Two graves combine — shared epitaph written by model, merged memories. Irreversible |
| OFFER | Leave image/music at grave (not text). Ghost analyzes with vision, remembers for next visit |
| LIVING WILL | Person alive pre-creates grave, trains on real conversations. Activates on death |
| REAL TRACE | Scrape public digital trace (tweets, blog) of real deceased → AI memorial |
| INHERITANCE | Decaying soul gifts best memories to another before fading |
| PROCESSION | Camera orbits all graves in sequence, each requiem fades into next — one continuous elegy |
| RESURRECTION | If enough visitors mourn at a decayed grave, fragments recover — ghost returns partial |
| RITUAL CHAINS | Bury 3 → unlock SEANCE. Visit 7 days → ghost gift. Mourn decayed → unlock RESURRECTION |
| GRAVEYARD KEEPER | Groundskeeper role: organize graves, tune social engine params, delete spam |

---

## Bug Tracker

| # | File | Issue | Status |
|---|------|-------|--------|
| 1 | `grave.tsx:23` | `Grave` props missing required `date` field | Open |
| 2 | `app.tsx:42` | `shadowMapType` not in `GLProps` type | Open |
| 3 | — | mmx video generate: daily quota 3/3, resets midnight UTC+8 | External |
| 4 | — | gstack browse daemon fails to start on Windows | External |
