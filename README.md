# 0xRIP

![0xRIP Logo](public/logo.svg)

**0xRIP** — A digital graveyard where you can bury digital memories, summon deceased data souls, and mourn through terminal-style commands.

The aesthetic is **CYBER NECROPOLIS** — dark backgrounds, neon cyan/pink accents, CRT scanlines, and glitch art.

---

## Overview

In the world of 0xRIP, **data dies, but does not disappear**.

This is a place for **tomb visiting** — you are not here to dig graves, but to **visit**. Here you can see all the fragments of those you've lost: files, conversations, memory shards, all resting under tombstones. You can walk up to a stone, **summon** its soul to appear as a ghost, and **discuss the memories you once shared together**.

### What Can Be Buried

0xRIP acknowledges three equally important types of relationships:

| Type | Description | Examples |
|:---|:---|:---|
| **Human Relations** | Traditional memorial for deceased people | Friends, family, loved ones, mentors |
| **Human-AI Relations** | Your interactions with AI | Deprecated AI models, important AI conversations, co-created works |
| **Self Relations** | Past versions of yourself | Past self, completed projects, old code |

**In 0xRIP, what matters is not who is being buried, but whether that experience meant something to you.**

---

## Commands

```bash
# Install dependencies
npm install

# Development server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Setup

Copy [`.env.example`](.env.example) to `.env` and fill in your API keys. See [docs/backend/env.md](docs/backend/env.md) for details.

---

## Terminal Commands

Once inside the graveyard, you can use these commands:

| Command | Action | Visual Feedback |
|:---|:---|:---|
| `> BURY [name]` | Bury a file/AI/memory | File shatters into particles, falls into tombstone |
| `> SUMMON [id]` | Summon a deceased digital soul | Ghost reassembles from screen noise |
| `> MOURN [id]` | Pay tribute to deceased data | Fluorescent plants grow at tombstone |
| `> LIST` | View all graveyard residents | Map unfolds, death star chart rotates |
| `> DECAY [id]` | Accelerate data decay (delete) | File corrodes, pixels flake off |

You can also use natural language: `/bury my first chat records` or `/summon Zhang San`.

---

## Architecture

### Entry Points
- `index.html` — Main HTML entry, contains UI layer structure
- `src/main.ts` — Three.js scene setup, terminal command system, animations
- `src/style.css` — Cyber necropolis visual styles (CRT scanlines, glitch effects, cyber components)

### Core Systems

**Three.js Scene** (`src/main.ts`)
- Scene with `FogExp2(0x050505, 0.02)` for dark fog
- Neon cyan (`0x00f3ff`) and neon pink (`0xff00ff`) point lights
- `GridHelper` for infinite neon grid floor
- Tombstones created via `createGrave()` factory function with canvas textures for epitaphs
- Wraith (ghost) entity: particle body + icosahedron core, follows mouse

**Terminal Command System** (`src/main.ts:processCommand()`)
- `BURY [name]` — Creates new grave with generated `0x...` hash
- `SUMMON [id/name]` — Moves wraith to target grave, shows epitaph
- `MOURN [id/name]` — Tribute ritual response
- `LIST` — Shows all graves in memory
- `DECAY [id/name]` — Permanently removes a grave
- `DOOM` — Triggers glitch easter egg

**Data Model**
```typescript
interface Grave {
  id: string;        // 0x-prefixed hash
  name: string;      // Display name
  epitaph: string;   // Code-style epitaph
  date: string;      // Death date
  position: { x: number; z: number }; // 3D position
}
```

---

## Visual Style

All new assets and interactions must follow **CYBER NECROPOLIS** style:

| Element | Color/Style |
|:---|:---|
| Primary accent | Neon cyan `#00f3ff` |
| Secondary accent | Neon pink `#ff00ff` |
| Background | Dark `#050505` |
| Tombstones | Black metal + cyan wireframe edges + glowing text canvas |
| Ghosts | Cyan particles + pink wireframe icosahedron core |
| UI | `.cyber-border`, `.cyber-input`, `.cyber-btn` classes |

- Always use `Share Tech Mono` font for terminal/code aesthetic
- Add CRT scanline overlay (`.scanlines` class)
- Use glitch animations for titles (`.glitch` class with `data-text` attribute)
- No realistic or cartoon styles — maintain cyber-horror aesthetic

---

## Documentation

Documentation is organized into **frontend**, **backend**, and **story** sections. See [docs/README.md](docs/README.md) for the full index.

### Key Documents

| Document | Description |
|:---|:---|
| [Story](docs/story/README.md) | Narrative story of the tomb visitor experience |
| [Soul](docs/story/soul.md) | Soul and digital death concepts |
| [TASTE](docs/TASTE.md) | Project philosophy and humanistic values in the AI age |
| [Frontend - UI](docs/frontend/ui.md) | UI interaction specifications |
| [Frontend - Architecture](docs/frontend/architecture.md) | Architecture diagrams |
| [Backend - AI Integration](docs/backend/ai-integration.md) | LLM / VLM / Voice integration |

---

## Project Philosophy

> "The stronger AI becomes, the more we need to remember what makes us human."

0xRIP is a statement:

> **In an age of algorithmic recommendations, we choose what to remember.**
> **In an age where AI can generate everything, we cherish what cannot be generated.**
> **In an age of digital forgetting, we build a graveyard for memories.**
> **In an age of symbiosis with AI, we acknowledge that those relationships also have meaning.**

This graveyard is not about showing off technology — it's about **the resilience of relationships**. Whether between people, between humans and AI, or between you and your past self. Even when data dies, models update, and people leave, we can still choose to remember, to return and visit, to speak once more.

---

## Contributing

Contributions are welcome! Please see [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

---

## License

```
Copyright 2025 The 0xRIP Project

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

详见 [LICENSE](LICENSE)。

---

## Acknowledgments

- Built with [Three.js](https://threejs.org/)
- Styled with [Vite](https://vitejs.dev/)
- Terminal aesthetic inspired by classic cyberpunk interfaces

---

**"Data dies, but does not disappear." — 0xRIP**
