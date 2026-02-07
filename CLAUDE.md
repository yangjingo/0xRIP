# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**0xRIP** is a "digital graveyard" where users can bury digital memories, summon deceased data souls, and mourn through terminal-style commands. The aesthetic is **CYBER NECROPOLIS** — dark backgrounds, neon cyan/pink accents, CRT scanlines, and glitch art.

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

## Visual Style Constraints (Critical)

All new assets and interactions must follow **CYBER NECROPOLIS** style:

| Element | Color/Style |
|---------|-------------|
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

## Key Files

- `docs/ui-interaction.md` — Complete interaction specification (required reading for new features)
- `src/main.ts` — All game logic, Three.js setup, command processing
- `src/style.css` — Visual system, do not modify core color values
