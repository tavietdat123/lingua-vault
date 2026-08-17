---
name: ui-ux-pro-max
description: >-
  Comprehensive guide and design framework for building high-end, aesthetic, 
  glassmorphic, micro-interactive, and accessible web and mobile user interfaces (UI/UX Pro Max).
---

# UI/UX Pro Max Engineering Framework

This skill establishes the design philosophy, token standards, interaction patterns, and code blueprints for crafting world-class "Pro Max" web and mobile interfaces.

---

## 1. Core Principles of UI/UX Pro Max

1. **Beauty Linked to Utility**: Every aesthetic element (shadow, glow, blur, transition) must serve information hierarchy and reduce cognitive friction.
2. **Micro-Interactions & Fluid Life**: Interfaces must feel responsive and alive. Every button hover, state change, modal pop, and sound wave uses smooth spring physics.
3. **Zero-Cliché Standard**:
   - 🚫 No boring, flat, textureless surfaces.
   - 🚫 No unstyled purple-on-dark templates or oversized untracked text.
   - 🚫 No harsh borders or raw unrounded boxes.
   - ✅ Curated HSL glassmorphism, multi-layer ambient glows, and crisp typography.

---

## 2. Design System Tokens (CSS Variables)

```css
:root {
  /* Color Foundations */
  --bg-primary: #090d16;
  --bg-secondary: #0f172a;
  --bg-tertiary: #1e293b;
  --bg-card: rgba(30, 41, 59, 0.72);
  --bg-glass: rgba(15, 23, 42, 0.78);

  /* Borders & Glows */
  --border-color: rgba(255, 255, 255, 0.08);
  --border-focus: rgba(56, 189, 248, 0.65);
  --shadow-glow: 0 0 24px rgba(56, 189, 248, 0.18);

  /* Accents */
  --accent-primary: #38bdf8;
  --accent-primary-hover: #0ea5e9;
  --accent-primary-light: rgba(56, 189, 248, 0.12);
  --accent-success: #10b981;
  --accent-warning: #f59e0b;
  --accent-danger: #ef4444;
  --accent-purple: #a855f7;

  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Elevations & Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --radius-full: 9999px;

  /* Spring Transitions */
  --transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-bounce: 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## 3. Key Component Blueprints

### A. Glassmorphic Card with Hover Lift
```css
.card {
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  transition: transform var(--transition-bounce), box-shadow var(--transition-bounce), border-color var(--transition-fast);
}

.card:hover {
  transform: translateY(-3px);
  border-color: rgba(56, 189, 248, 0.35);
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.35), var(--shadow-glow);
}
```

### B. 3D Flip Flashcard Engine
```css
.flashcard-3d-scene {
  perspective: 1200px;
  width: 100%;
}

.flashcard-3d-inner {
  position: relative;
  width: 100%;
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-style: preserve-3d;
}

.flashcard-3d-inner.flipped {
  transform: rotateY(180deg);
}

.flashcard-face {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: var(--radius-xl);
}

.flashcard-face-back {
  transform: rotateY(180deg);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
```

### C. Live Sound Wave Visualizer
```css
.sound-wave {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 18px;
}

.sound-wave span {
  width: 3px;
  background: var(--accent-primary);
  border-radius: 2px;
  animation: wave 1.2s ease-in-out infinite alternate;
}

.sound-wave span:nth-child(1) { height: 60%; animation-delay: 0s; }
.sound-wave span:nth-child(2) { height: 100%; animation-delay: 0.2s; }
.sound-wave span:nth-child(3) { height: 40%; animation-delay: 0.4s; }
.sound-wave span:nth-child(4) { height: 80%; animation-delay: 0.1s; }

@keyframes wave {
  0% { transform: scaleY(0.3); }
  100% { transform: scaleY(1); }
}
```

---

## 4. Interaction Patterns

1. **Global Command Palette (`⌘K` / `Ctrl+K`)**:
   - Universal spotlight search across all entities (words, grammar patterns, documents).
   - Fast action executor (Switch theme, Export backup, Add new card).
2. **Keyboard Ergonomics**:
   - `Space`: Flip Flashcard.
   - `1, 2, 3, 4`: Grade SRS retention (`Again`, `Hard`, `Good`, `Easy`).
   - `Escape`: Dismiss any modal or overlay instantly.
3. **Smart Selection Highlighting**:
   - Selecting text inside reader views automatically exposes a floating contextual toolbar for instant audio playback, AI breakdown, or quick-add to vocabulary.
4. **Toast Feedback**:
   - Non-blocking, beautiful toast notifications at screen bottom for all actions (create, edit, delete, backup).
