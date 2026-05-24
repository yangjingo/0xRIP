# DESIGN.md — 0xRIP UI

## Overview

0xRIP is a digital graveyard terminal. The UI is not a dashboard, admin console, or file browser. It is a single monochrome command surface staged inside a 3D memorial world.

The visual direction is severe, editorial, and ritualized:
- black field, white type, ash-gray structure
- one terminal as the active surface
- one graveyard world as atmospheric context
- one interaction at a time

The interface should feel authored, not assembled.

## Design Direction

### Product Reading

0xRIP should read as a live ritual.

That means:
- the user should always know what is active now
- the interface should prioritize presence over management
- the scene should support mood, not compete with the terminal
- the UI should feel narrow by design, not incomplete

### Core Claim

One terminal is enough to hold the whole encounter.

This claim should remain true across layout, motion, copy, and styling.

## Core Characteristics

- Near-pure black canvas (`{colors.canvas}` - `#000000`). No light mode.
- White typography (`{colors.text}` - `#ffffff`) as the primary signal color.
- JetBrains Mono everywhere (`{typography.font}`). No serif. No sans-serif.
- One terminal UI with `/` command palette and streaming output.
- 3D dark monolith tombstones with white wireframe selection indicators.
- Sharp corners, thin borders, no ornamental chrome.

## Region Layout

Region layout is a product rule, not just a spacing rule.

### 1. World Region

The 3D graveyard is the environmental layer.

Purpose:
- establish tone
- anchor burial and memorial metaphor
- give the terminal a place to appear from

Rules:
- keep the world low-contrast and recessive
- geometry should read as monoliths, grid, platform, fog, ghost mass
- no bright set dressing, colorful effects, or decorative props
- the world must never become more visually active than the terminal

### 2. Interaction Region

The terminal is the primary region and the only true work surface.

Purpose:
- receive command input
- display streamed ghost output
- surface ritual progression

Rules:
- keep the terminal visually centralized when active
- maintain a clear rectangular silhouette
- preserve strong separation between output area and input bar
- never fragment the interaction across multiple floating panels

### 3. Command Palette Region

The slash palette is a transient guidance region, not a second product.

Purpose:
- teach commands quickly
- shorten recall burden
- keep discovery inside the terminal contract

Rules:
- appears only in direct response to `/`
- should feel integrated into terminal flow
- active row can invert emphasis through darker surface and brighter text
- avoid badge-heavy, menu-heavy, or app-launcher aesthetics

### 4. Presence Region

Presence is conveyed through streaming text, TTS state, ambient sound, and the selected grave relationship.

Purpose:
- make the ghost feel live
- make summon feel like a channel, not a fetch

Rules:
- streaming state should be legible but subtle
- waveform, cursor, or thinking indicators are allowed only when tied to active presence
- do not add generic notification UI

## Viewpoint Emphasis

The UI must emphasize the product's viewpoint, not just expose features.

### Primary Viewpoint

0xRIP is a live ritual, not a dashboard.

### Emphasis Hierarchy

1. Current ritual state
- what the user is doing now: selecting, burying, summoning, listening, closing

2. Ghost presence
- streamed reply
- voice playback state
- selected grave context

3. Command legibility
- slash verbs
- input prompt
- concise system feedback

4. Atmospheric support
- graveyard world
- fog
- wireframes
- ambient sound

### What To Emphasize Visually

- active grave selection through white wireframe and focus
- live ghost text through brighter treatment and motion
- user intent through a clear input line and prompt structure
- ritual verbs through concise labels and direct language

### What To De-emphasize

- infrastructure detail
- generic settings chrome
- secondary metadata
- persistent helper panels
- decorative motion that does not clarify state

## Color Logic

Color in 0xRIP is role-based, not decorative.

### Principle

White communicates active presence.
Gray communicates structure.
Near-black communicates mass, depth, and silence.

There is no expressive rainbow system. Emotional range comes from contrast, pacing, wording, and atmosphere rather than hue variation.

### Surface Logic

- **Canvas** (`{colors.canvas}` - `#000000`)
  - base field for body, world background, and negative space
- **Input Bar** (`{colors.surface-input}` - `#050505`)
  - slightly lifted interaction edge
- **Suggestions Active** (`{colors.surface-suggestion}` - `#1a1a1a`)
  - strongest dark-surface accent for temporary focus

Use surfaces to separate functions quietly. Surface changes should be incremental, never dramatic.

### Text Logic

- **Primary** (`{colors.text}` - `#ffffff`)
  - active UI, focal labels, live ghost response, critical headings
- **Body** (`{colors.text-body}` - `#dddddd`)
  - standard readable output
- **Input Echo** (`{colors.text-input}` - `#aaaaaa`)
  - user-entered command history
- **Muted** (`{colors.text-muted}` - `#888888`)
  - help text, system scaffolding, secondary explanation
- **Faint** (`{colors.text-faint}` - `#555555`)
  - hints, inactive affordances, low-priority interface noise

Text should step down predictably from white to gray. Do not skip straight from full white to near-invisible gray without reason.

### Border Logic

- **Hairline** (`{colors.border}` - `#333333`)
  - terminal frame, dividers, separators
- **Hairline Inner** (`{colors.border-inner}` - `#222222`)
  - lower-priority internal separation

Borders should describe structure, never decoration.

### Semantic Exception

- **Error** (`{colors.error}` - `#ff4444`)
  - reserved for failure, loss of signal, or blocked action

No green success state, no blue info state, no yellow warning state. The product should not drift into dashboard semantics.

### 3D Scene Logic

- **Monument** (`{colors.monument}` - `#0a0a0a`)
  - tombstone body
- **Monument Cap** (`{colors.monument-cap}` - `#1a1a1a`)
  - top form differentiation
- **Wireframe** (`{colors.wireframe}` - `#ffffff`)
  - active selection and ritual readiness
- **Wireframe Dim** (`{colors.wireframe-dim}` - `#222222`)
  - inactive structural indication
- **Platform** (`{colors.platform}` - `#111111`)
  - scene staging mass
- **Grid** (`{colors.grid}` - `#1a1a1a`)
  - spatial grounding
- **Ghost Core** (`{colors.ghost-core}` - `#1a1a1a`)
  - central body mass
- **Ghost Emissive** (`{colors.ghost-emissive}` - `#111111`)
  - inner signal
- **Ghost Glow** (`{colors.ghost-glow}` - `#ffffff`)
  - low-opacity aura only
- **Fog** (`{colors.fog}` - `#000000`)
  - atmospheric merge into canvas

The world uses color to recede. The terminal uses color to speak.

## Typography

### Font Family

JetBrains Mono -> Courier New -> Consolas -> monospace.

Single font family. No brand display font. No sans companion.

### Type Scale

| Token | Size | Weight | Use |
|---|---|---|---|
| `{typography.brand}` | 28px | 700 | 0xRIP wordmark |
| `{typography.label}` | 10px | 400 | micro labels, subtitles |
| `{typography.body}` | 13px to 14px | 400 | terminal output, input, body copy |
| `{typography.suggestion}` | 12px | 400 / 700 | command palette items |
| `{typography.hint}` | 10px | 400 | shortcuts, low-priority hints |
| `{typography.spinner}` | 12px | 400 | thinking / status microcopy |

### Type Principles

- monospace always
- weight creates hierarchy, not font family swaps
- italic is reserved for ghost replies or clearly spectral speech
- uppercase is reserved for micro labels and system framing
- letter spacing should stay restrained

## Layout Metrics

### Terminal

- Width: about `600px` in the 3D `Html` layer
- Output height: about `280px`, scrollable
- Input height: about `48px`
- Placement: attached to selected grave context, not pinned like a desktop window

### Internal Spacing

- Terminal shell padding: about `24px`
- Output vertical padding: about `16px`
- Suggestion item padding: about `6px` vertical, `16px` horizontal
- Keep spacing regular and severe; do not soften with oversized breathing room

## Elevation And Shape

### Elevation

No shadows. No blur. No glass.

Depth comes from:
- 3D perspective
- slight surface contrast
- wireframe activation
- motion and focus changes

### Shape

No border radius.

All surfaces should feel cut, framed, or monolithic.

## Interaction Rules

- `/` opens command palette with arrow-key navigation
- `Tab` completes, `Enter` selects, `Escape` dismisses
- click tombstone in 3D -> camera focus -> terminal appears at grave position
- ghost replies stream character by character
- TTS playback can accompany ghost replies
- ambient audio can rise during summon and resolve on `/quit`

Interaction should feel linear and intentional. Avoid parallel flows competing for attention.

## Motion And Presence

Motion is permitted only when it reinforces ritual state.

Allowed:
- streaming cursor
- subtle waveform movement during active speech
- low-intensity scene drift or fog movement
- selection transitions that clarify focus

Avoid:
- bounce
- playful easing
- decorative parallax
- busy hover choreography
- idle animation that makes the scene feel game-like

## Do's And Don'ts

### Do

- keep one dominant interaction surface
- use contrast to establish focus
- make the active ritual state obvious
- let the scene support mood without stealing attention
- write UI copy like authored commands, not SaaS labels

### Don't

- don't introduce color accents beyond error red
- don't split the experience into cards, dashboards, or floating utilities
- don't add rounded corners, shadows, blur, or glass
- don't over-explain with interface chrome
- don't let the environment outshine the terminal
