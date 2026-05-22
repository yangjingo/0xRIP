# 0xRIP

A digital graveyard. Bury memories. Summon data souls. Mourn through a 3D memorial world.

## Verbs

| Action | Command | API |
|--------|---------|-----|
| **Bury** | `/bury` | `POST /api/graves` |
| **Summon** | `/summon <id>` | `POST /api/summon/:id/chat` (SSE stream) |
| **List** | `/list` | `GET /api/graves` |
| **Mourn** | (future) | `POST /api/graves/:id/mourn` |
| **Decay** | (future) | `DELETE /api/graves/:id` |

## Soul types

Three equal relationships: human→human, human→AI, human→self. Buried in `.rip/<grave_id>/` with profile.md + session memories.

## Aesthetic

Pure monochrome ASCII terminal. Black canvas, white text, single `/` command interface. JetBrains Mono everywhere.
