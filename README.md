# 0xRIP

![0xRIP Logo](.assert/logo.svg)

**0xRIP** — A digital graveyard where you can bury digital memories, summon deceased data souls, and mourn through a 3D memorial world.

The aesthetic combines **Monument Valley's** minimalist geometric world with **Sheikah Slate's** sci-fi interface design — clean grayscales with cyan accents, glass morphism panels, and smooth spatial interactions.

- [2026.02.27] static html v1
![V1 0xRIP Preview](./assert/0xRIP-UI-V1.png)

---

## Quick Start

No build step required! Open directly in your browser:

```bash
# macOS
open examples/memorial-world/index.html

# Linux
xdg-open examples/memorial-world/index.html

# Or use any static server for better module support
npx serve examples/memorial-world
```

---

## Features

- **3D Memorial World** — Monument Valley-inspired geometric landscapes
- **Sheikah Slate Panel** — Glass-morphism UI with slide-up animation
- **Bilingual Support** — One-click switch between English and Chinese (语言切换)
- **Interactive Ghost** — Entity that follows your cursor and flies to selected monuments
- **Smooth Animations** — Cubic-bezier transitions for camera and UI

---

## Overview

In the world of 0xRIP, **data dies, but does not disappear**.

This is a place for **tomb visiting** — you are not here to dig graves, but to **visit**. Here you can see all the fragments of those you've lost: files, conversations, memory shards, all resting under monuments. You can walk up to a stone, **summon** its soul to appear as a ghost, and **discuss the memories you once shared together**.

### What Can Be Buried

0xRIP acknowledges three equally important types of relationships:

| Type | Description | Examples |
|:---|:---|:---|
| **Human Relations** | Traditional memorial for deceased people | Friends, family, loved ones, mentors |
| **Human-AI Relations** | Your interactions with AI | Deprecated AI models, important AI conversations, co-created works |
| **Self Relations** | Past versions of yourself | Past self, completed projects, old code |

**In 0xRIP, what matters is not who is being buried, but whether that experience meant something to you.**

---

## Project Structure

```
/0xRIP
├── docs/                    # Design documentation
│   ├── DESIGN_SYSTEM.md     # Visual design system
│   └── UI_COMPONENTS.md     # Copy-paste ready UI components
├── examples/                # Pure HTML examples
│   ├── memorial-world/      # ← Main 3D application (bilingual)
│   └── monument-valley-minimal/  # Minimal Monument Valley style
├── assert/                 # Static assets (images, fonts)
├── CLAUDE.md              # Development guidelines
├── LICENSE
└── README.md
```

---

## Architecture

### Entry Point
- `examples/memorial-world/index.html` — Complete bilingual application in a single HTML file

### Core Systems

**Three.js Scene**
- Scene with soft fog and ambient lighting
- Monument Valley-inspired geometric platforms at different elevations
- Clean white monuments with dark caps
- Ghost entity that follows mouse and flies to selected monuments
- Smooth camera transitions with easing

**UI Panel (Sheikah Slate)**
- Bottom panel with glass morphism effect
- Three-column layout: Monument List | Details | Actions
- Toggle between collapsed (handle only) and expanded states
- Responsive hover states with cyan accents

**Data Model**
```typescript
interface Monument {
  id: string;        // '0x' + random hex
  name: string;      // Display name
  epitaph: string;   // Quote or text
  date: string;      // Date created
  position: { x: number; z: number }; // 3D position
}
```

---

## Visual Style

### Color System

| Variable | Value | Usage |
|:---|:---|:---|
| `--mv-bg` | `#fafafa` | Page background |
| `--mv-white` | `#ffffff` | Cards, monuments |
| `--mv-charcoal` | `#404040` | Text, monument caps |
| `--mv-text-dim` | `#666666` | Secondary text |
| `--sheikah-blue` | `#00d4ff` | Accent, hover states |

### Typography
- **Brand/Headings**: Cormorant Garamond (serif)
- **Body/UI**: Space Mono (monospace)
- Uppercase with letter-spacing for labels

### Key Features
- Clean grayscale palette with cyan accent
- Glass morphism panels with backdrop blur
- Smooth cubic-bezier transitions (400ms panel, 1200ms camera)
- Monument Valley geometric aesthetic
- Sheikah Slate-inspired sci-fi UI elements

---

## Interactions

| Action | Behavior |
|:---|:---|
| Click handle bar | Toggle panel expanded/collapsed |
| Click monument in 3D | Select + show details + fly ghost |
| Click list item | Focus camera on monument |
| Hover monument | Show tooltip with name |
| Drag background | Orbit camera |
| Scroll | Zoom in/out |

---

## Documentation

| Document | Description |
|:---|:---|
| [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Complete visual design system |
| [UI_COMPONENTS.md](docs/UI_COMPONENTS.md) | Copy-paste ready CSS/JS components |
| [CLAUDE.md](CLAUDE.md) | Development guidelines for AI assistants |

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

- Built with [Three.js](https://threejs.org/) (via CDN)
- Typography: [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) & [Space Mono](https://fonts.google.com/specimen/Space+Mono)
- Design inspired by Monument Valley game and Zelda: Breath of the Wild's Sheikah Slate

---

**"Data dies, but does not disappear." — 0xRIP**
