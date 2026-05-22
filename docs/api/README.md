# 0xRIP Backend

Bun + MiniMax (Anthropic-compatible endpoint + mmx CLI) + SQLite.

## Quick Start

```bash
bun install
bun run dev                    # http://localhost:8000
npm install -g mmx-cli
mmx auth login --api-key <key>
```

## Stack

| Layer | Tech |
|-------|------|
| Runtime | Bun |
| HTTP | Bun.serve() |
| Text chat | MiniMax M2.7 via Anthropic-compatible endpoint |
| Media | mmx CLI subprocess (image/music/video/speech/vision) |
| DB | SQLite + Drizzle ORM |
| Validation | Zod |

## Flow

```
POST /api/summon/:id/chat
  → context.buildMessages()        # system prompt + memory + history
  → POST api.minimaxi.com/anthropic/v1/messages (MiniMax-M2.7)
  → tool-use loop (max 5): mmx CLI subprocess
  → context.saveExchange()         # .rip/<id>/sessions/
  → SSE stream reply to client
```

## Endpoints

### Graves
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/graves` | List all graves |
| POST | `/api/graves` | Create grave `{name, epitaph, date, skill_type?}` |
| GET | `/api/graves/:id` | Get grave |
| PUT | `/api/graves/:id` | Update grave |
| DELETE | `/api/graves/:id` | Delete (cascade) |
| GET | `/api/graves/:id/memories` | Long-term memories |
| GET | `/api/graves/:id/profile` | Read soul profile |
| PUT | `/api/graves/:id/profile` | Write soul profile |

### Summon
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/summon/:id/session` | Create session |
| GET | `/api/summon/:id/sessions` | List sessions |
| POST | `/api/summon/:id/chat` | Chat (tool-use loop) |
| POST | `/api/summon/:id/chat/stream` | Chat (SSE streaming) |
| POST | `/api/summon/:id/requiem` | Generate requiem — `mmx music generate` |
| POST | `/api/summon/:id/promote` | Promote memories (.rip → SQLite) |
| POST | `/api/summon/:id/sessions/:sid/summary` | Session summary |

### Generate (mmx CLI)
| Method | Path | mmx command |
|--------|------|-------------|
| POST | `/api/generate/image` | `mmx image generate` |
| POST | `/api/generate/speech` | `mmx speech synthesize` |
| POST | `/api/generate/video` | `mmx video generate --async` |
| GET | `/api/generate/video/:taskId` | `mmx video task get` |

### Skills
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/skills` | List persona types from `skills/` |

## Agent tools → mmx CLI

| Agent tool | mmx command |
|------------|-------------|
| `generate_image` | `mmx image generate --prompt P --aspect-ratio R --output json` |
| `generate_music` | `mmx music generate --prompt P --lyrics L --out O` |
| `generate_video` | `mmx video generate --prompt P --async` |
| `synthesize_speech` | `mmx speech synthesize --text T --voice V --out O` |
| `analyze_image` | `mmx vision describe --image URL --prompt P --output json` |

## Memory

- **Short-term**: `.rip/<grave_id>/sessions/<session_id>/memories/*.md` (filesystem)
- **Long-term**: SQLite `memories` table (promoted)
- **Profile**: `.rip/<grave_id>/profile.md`
- **Limit**: 500 memories/grave, FIFO eviction
