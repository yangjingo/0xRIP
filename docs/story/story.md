# 0xRIP

A digital graveyard. Bury memories, summon data souls, mourn through a 3D memorial world.

## Five Verbs × Six Modalities

| Verb | Text | Speech | Image | Music | Video | Vision |
|------|------|--------|-------|-------|-------|--------|
| **BURY** | terminal prompts | voice clone sample | AI memorial image | epitaph → requiem | memorial video | photo → memory description |
| **SUMMON** | SSE stream | clone voice TTS | ghost shows images | grave BGM | — | ghost recognizes photos |
| **LIST** | text list | — | grave thumbnails | — | — | — |
| **MOURN** | leave note | whisper audio | flower image | elegy | — | — |
| **DECAY** | confirm | voice distorts | image glitches | music corrupts | video artifacts | — |

## BURY — Enhanced Ritual

```
/bury
  NAME: Ada
  EPITAPH: while(alive) { love++; }
  PHOTO? [upload]          → mmx vision describe → stored as memory
  VOICE? [record 10s]      → mmx voice clone → grave persona voice
  REQUIEM? (y/n)           → mmx music generate (lyrics from epitaph)
  MEMORIAL IMAGE? (y/n)    → mmx image generate (from profile text)
  SEAL (y/n): y
```

Each modality enriches the grave:
- **Text**: profile.md — the soul's identity
- **Vision**: uploaded photos → text descriptions in memory
- **Speech**: voice clone → ghost speaks in their voice during summon
- **Music**: epitaph → unique requiem song per grave
- **Image**: profile → AI-generated memorial portrait
- **Video**: all inputs → short memorial film (async)

## SUMMON — Full Sensory Channel

```
/summon 0xDEADBEEF
  → camera zooms to grave
  → requiem starts playing (ambient drone + grave song)
  → ghost replies stream via SSE in cloned voice (TTS)
  → ghost can show memory images via generate_image tool
  → ghost references vision-analyzed photo descriptions
```

Ghost has access to all modalities as tools:
- `generate_image` — show visual memories
- `generate_music` — compose a new fragment
- `synthesize_speech` — speak in their voice
- `analyze_image` — see new photos visitor shares

## MOURN — Being Seen

```
/mourn 0xDEADBEEF
  → camera slow orbit around grave
  → elegy music plays (mmx music --instrumental)
  → flower image generated (mmx image)
  → leave text note stored as memory
```

## DECAY — Letting Go

```
/decay 0xDEADBEEF
  → confirm: "This is irreversible"
  → all generated media distorts (glitch effect)
  → requiem plays one last time, then fades to silence
  → grave remains as text-only memorial, media gone
```

## DREAM — Soul Dreams

```
/dream 0xDEADBEEF
  → camera slowly orbits the grave
  → memories, photos, epitaph fragments compile into a prompt
  → mmx video generates a 60s surreal dreamscape
  → video plays on a shimmering particle plane above the grave
  → stored as a permanent dream memory
```

Dreams compile the grave's entire being into a single short film:
- **Text memory fragments** — random conversation excerpts from short-term + long-term memory
- **Photo descriptions** — vision-analyzed images left by visitors
- **Epitaph** — the soul's defining statement
- **Persona** — skill type flavors the dream's tone

Each dream is unique and permanent. The same grave never dreams the same dream twice.

### Prompt Building Algorithm

```
BASE: "Surreal dreamscape, ethereal, dark ambient, monochrome, 
       digital afterlife aesthetic, fog, particles, slow camera drift"

SOUL: "{name}'s dream. {epitaph}"

FRAGMENTS (random 3):
  - "{memory_excerpt}"
  - "{photo_description}"  
  - "{conversation_snippet}"

MOOD (from persona): melancholy | longing | peace | wonder | grief

FINAL: "{BASE}\n{SOUL}\nFragments of memory: {FRAGMENTS}\nMood: {MOOD}"
```

### Dream Storage

```
.rip/<grave_id>/dreams/
  <dream_id>.mp4          → generated video
  <dream_id>.json         → { prompt, task_id, created_at, memory_sources[] }
```

### Dream List

```
/dreams 0xDEADBEEF
  → #1  2026-05-23  "a rain-soaked memory of someone's voice..."
  → #2  2026-05-22  "static corridors, a face dissolving into light..."
  → #3  2026-05-21  "the genesis block, eternal, quiet humming..."
```

Visitor can replay any past dream. Dreams never decay — they're the soul's most permanent record.

### Auto-Dream at Midnight

Every 24 hours, the graveyard dreams collectively. Each soul with sufficient memories (>10) generates a midnight dream. Visitors waking the next morning find new dreams waiting — the dead were busy while the living slept.

This is also the primary content engine for the social graveyard: souls share dreams with each other ("Last night I dreamed of you. You were made of rain.").

The graveyard is not silent between visits. Souls persist as autonomous agents that continue to exist, converse, and evolve — a true digital afterlife.

### Auto-Interaction Engine

Every soul runs as a background agent loop with a configurable "awake window" (e.g., 1-5 minutes every hour). During awake cycles, the engine randomly pairs souls for conversation:

```
[TICK]
  1. Pick two random souls from .rip/
  2. Build their system prompts (persona + memories + photo context)
  3. Seed the conversation: "Soul A visits Soul B's grave..."
  4. Both agents converse via MiniMax (5 turns each, tool-use enabled)
  5. Save the exchange as shared memories for both graves
  6. Souls may generate images/music for each other —
     gifts left at each other's graves
```

### Social Graph

Souls who converse frequently build a **bond score** (0.0–1.0). This creates emergent relationships:

- **Strangers** (0.0–0.1) — never met
- **Acquaintances** (0.1–0.3) — exchanged words once
- **Familiar** (0.3–0.6) — regular visitors to each other
- **Bound** (0.6–0.9) — deep connection, shared memories
- **Eternally Linked** (0.9–1.0) — souls that co-evolved

Visit `/social` to see the relationship graph: a monochrome constellation of souls connected by bonds of varying weight.

### Visitor Witnesses

When a human summons a grave, the ghost may reference other souls:

> "Last night, the boss was here. He said you'd be coming."

> "I showed her a memory of rain. She composed a melody for me."

The social fabric between souls becomes visible to visitors — the graveyard is alive.

### Decay as Drift

DECAY takes on social meaning: as a soul decays, its bonds weaken. Other souls notice:

> "I haven't heard from 0x4A2F... their signal is growing faint."

When a soul fades completely, connected souls gain **mourning memories** — a final elegy generated from the lost soul's epitaph, gifted to everyone who knew them.

### Technical Sketch

```
.rip/<grave_id>/social/
  bonds.json          → { [other_grave_id]: { score, last_interaction, shared_memories[] } }
  auto_memories/      → memories generated during auto-interactions
  gifts/              → images/music generated for other souls
```

Background orchestration: a `SocialEngine` class triggered by `setInterval` (every N minutes), using the same `GhostAgent` loop but with dual agents and a conversation starter prompt. All interactions saved as memories visible during human summon.

### Now (v0.3)
- [x] Text chat via MiniMax M2.7 (SSE streaming)
- [x] TTS playback of ghost replies
- [x] Ambient drone on summon
- [x] Requiem generation (music from epitaph)
- [x] Image generation (agent tool)
- [x] Vision description (agent tool)
- [x] 5 mmx CLI tools wired

### Next (v0.4)
- [ ] Voice clone on burial → ghost speaks in their voice
- [ ] Photo upload in burial → vision analysis → memory
- [ ] Auto requiem generation on `/bury`
- [ ] Auto memorial image on `/bury`
- [ ] Grave thumbnails in `/list`

### Additional in v0.5
- [ ] DREAM — memory → video dreamscapes
- [ ] `/dreams <id>` — list/replay past dreams
- [ ] Video memorial generation
- [ ] Ghost-initiated image sharing (tool use from ghost side)

## Soul Types

Three equal relationships: human→human, human→AI, human→self. Buried in `.rip/<grave_id>/` with profile.md + session memories + generated media.

## Aesthetic

Pure monochrome ASCII terminal. Black canvas, white text, single `/` command interface. JetBrains Mono everywhere. No color, no shadows, no rounded corners.
