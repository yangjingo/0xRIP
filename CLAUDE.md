# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**0xRIP** is a "digital graveyard" where users can bury digital memories, summon deceased data souls, and mourn through a 3D memorial world. The aesthetic combines **Monument Valley's** minimalist geometric world with **Sheikah Slate's** sci-fi interface design — clean grayscales with cyan accents, glass morphism panels, and smooth spatial interactions.

## Quick Start

No build step required! Open directly in your browser:

```bash
# Using any static file server
npx serve examples/3d-world

# Or simply open the file
open examples/3d-world/index.html
```

## Architecture

### Entry Point
- `examples/3d-world/index.html` — Complete single-file application
  - Lines 9-420: CSS styles (design system, components, animations)
  - Lines 422-470: HTML structure
  - Lines 472+: JavaScript (Three.js setup, world generation, interactions)

### Core Systems

**Three.js Scene** (`examples/3d-world/index.html`)
- Scene with soft white fog (`Fog(0xffffff, 20, 180)`)
- Ambient + directional lighting with shadows
- Monument Valley-inspired geometric platforms at multiple elevations
- Clean white monuments (`MeshStandardMaterial` with roughness 0.3)
- Particle-based ghost entity that flies to selected monuments
- Smooth camera transitions with cubic easing

**Sheikah Slate Panel** (Bottom UI)
- Glass morphism with `backdrop-filter: blur(20px)`
- Toggle between collapsed (70px handle) and expanded (450px) states
- Three sections: Monument List | Selected Details | Actions
- Cyan accent color (`#00d4ff`) for hover/active states

**Data Model**
```typescript
interface Grave {
  id: string;        // '0x' + 8-char random hex
  name: string;      // Display name
  epitaph: string;   // Quote or text
  date: string;      // Creation date
  position: { x: number; y: number; z: number }; // 3D position
}
```

## Visual Style Constraints (Critical)

All new assets and interactions must follow **Monument Valley + Sheikah Slate** style:

| Element | Color/Style |
|---------|-------------|
| Background | Warm white `#fafafa` |
| Cards/Panels | Pure white `#ffffff` with blur |
| Text Primary | Charcoal `#404040` |
| Text Secondary | Dim `#666666` |
| Accent | Sheikah blue `#00d4ff` |
| Monuments | White body + dark cap `#404040` |
| Ghost | Cyan particles `#00d4ff` |

**Typography**
- Brand/Headings: `Cormorant Garamond` (serif, weight 300)
- Body/UI: `Space Mono` (monospace)
- Labels: Uppercase, letter-spacing 0.2em

**Key Patterns**
- Glass morphism panels with `backdrop-filter: blur(20px)`
- Border radius: 4px (small), 6px (medium), 8px (cards)
- Transitions: 300ms default, 400ms panel with `cubic-bezier(0.4, 0, 0.2, 1)`
- Sheikah Eye icon: oval shape with inner dot, glows cyan when active

## Key Files

- `examples/3d-world/index.html` — Main application (all-in-one)
- `docs/DESIGN_SYSTEM.md` — Complete design system documentation
- `docs/UI_COMPONENTS.md` — Copy-paste ready components
- `examples/2d-world/index.html` — 2D isometric prototype
- `examples/monument-valley-minimal/index.html` — Minimal style demo

## Design Principles

1. **Progressive Disclosure**: Panel starts collapsed, expands when needed
2. **Spatial Awareness**: Camera smoothly transitions between targets (1200ms)
3. **Immediate Feedback**: Every action has visual confirmation
4. **Consistent Language**: Grayscale + cyan accent throughout
5. **Minimalism**: Clean lines, generous whitespace, no visual noise
