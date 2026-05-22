# DESIGN.md — 0xRIP

## Overview

0xRIP is a **digital graveyard terminal**. The interface is a pure monochrome ASCII command-line rendered in a 3D memorial world. The aesthetic draws from classic CRT terminals and brutalist minimalism — black canvas, white type, single font, no decoration.

**Key Characteristics:**
- Near-pure black canvas (`{colors.canvas}` — #000000). No light mode.
- White typography (`{colors.text}` — #ffffff) throughout. No color accents.
- JetBrains Mono everywhere (`{typography.font}`). No serif. No sans-serif. No exceptions.
- Single terminal UI — `/slash` command palette, no panels, no cards, no modals.
- 3D dark monolith tombstones with white wireframe selection indicators.

## Colors

### Surface
- **Canvas** (`{colors.canvas}` — #000000): Page floor and 3D scene background. Pure black.
- **Input Bar** (`{colors.surface-input}` — #050505): Terminal input row. Slightly lifted from canvas.
- **Suggestions Active** (`{colors.surface-suggestion}` — #1a1a1a): Highlighted suggestion row.

### Text
- **Primary** (`{colors.text}` — #ffffff): Headlines, ghost replies, active UI.
- **Body** (`{colors.text-body}` — #dddddd): Default terminal output.
- **Input Echo** (`{colors.text-input}` — #aaaaaa): User input echo in terminal.
- **Muted** (`{colors.text-muted}` — #888888): System messages, help text, secondary info.
- **Faint** (`{colors.text-faint}` — #555555): Hint text, keyboard shortcuts footer.

### Borders
- **Hairline** (`{colors.border}` — #333333): Terminal border, input divider, suggestion separator.
- **Hairline Inner** (`{colors.border-inner}` — #222222): Suggestion footer divider.

### Semantic
- **Error** (`{colors.error}` — #ff4444): Error messages, connection lost.

### 3D Scene
- **Monument** (`{colors.monument}` — #0a0a0a): Tombstone body. Near-black slab.
- **Monument Cap** (`{colors.monument-cap}` — #1a1a1a): Tombstone top cylinder.
- **Wireframe** (`{colors.wireframe}` — #ffffff): Selection wireframe on grave.
- **Wireframe Dim** (`{colors.wireframe-dim}` — #222222): Unselected wireframe.
- **Platform** (`{colors.platform}` — #111111): Architecture platform and arch.
- **Grid** (`{colors.grid}` — #1a1a1a): Floor grid lines.
- **Ghost Core** (`{colors.ghost-core}` — #1a1a1a): Ghost icosahedron body.
- **Ghost Emissive** (`{colors.ghost-emissive}` — #111111): Ghost inner glow.
- **Ghost Glow** (`{colors.ghost-glow}` — #ffffff): Ghost outer aura (low opacity).
- **Fog** (`{colors.fog}` — #000000): Scene fog.

## Typography

### Font Family
JetBrains Mono → Courier New → Consolas → monospace. Single font, no fallback to serif or sans-serif.

| Token | Size | Weight | Use |
|---|---|---|---|
| `{typography.brand}` | 28px | 700 | "0xRIP" wordmark |
| `{typography.label}` | 10px | 400 | "DIGITAL GRAVEYARD" subtitle |
| `{typography.body}` | 13px/14px | 400 | Terminal output, input |
| `{typography.suggestion}` | 12px | 400/700 | Command palette items |
| `{typography.hint}` | 10px | 400 | Keyboard shortcuts footer |
| `{typography.spinner}` | 12px | 400 | "thinking" indicator |

### Principles
- All monospace, always. The terminal contract.
- Weight 700 for hierarchy (brand, active suggestion cmd), 400 for body.
- No italic except ghost replies.
- No letter-spacing manipulation. Monospace is already even.

## Layout

### Terminal
- Width: 600px (in 3D Html component)
- Output height: 280px, scrollable
- Input height: 48px (py-3)
- Position: Html component at selected grave + transform

### Spacing
- Terminal internal padding: 24px (px-6)
- Output padding: 16px vertical (py-4)
- Suggestion item: 6px vertical (py-1.5), 16px horizontal (px-4)

## Elevation

No shadows. No blur. No glass morphism. Depth comes from:
- 3D scene perspective
- Slight surface contrast (#050505 input bar vs #000000 canvas)
- Wireframe visibility toggling on selection

## Shapes

No border radius. Sharp corners everywhere. This is a terminal, not a mobile app.

## Interaction

- `/` opens command palette with arrow-key navigation
- Tab completes, Enter selects, Escape dismisses
- Click tombstone in 3D → camera focus → terminal at grave position
- Ambient audio on summon, fades on `/quit`
- Ghost replies stream via SSE with character-by-character rendering
- TTS playback of ghost replies via MiniMax speech synthesis

## Do's and Don'ts

### Do
- Monospace everywhere. JetBrains Mono.
- Pure black background. White text.
- Single terminal for all interaction.
- Sharp corners. No border-radius.
- Subtle contrast: #000 vs #050 vs #1a1a1a.

### Don't
- Don't introduce color. No yellow, no green, no blue.
- Don't use serif or sans-serif fonts.
- Don't add shadows, blur, or glass morphism.
- Don't add panels, cards, modals, or buttons.
- Don't use rounded corners.
- Don't add hover effects beyond the command palette highlighting.
