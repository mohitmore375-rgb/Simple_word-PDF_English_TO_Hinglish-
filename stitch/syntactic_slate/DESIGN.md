# Design System Document: The Precision Lab

## 1. Overview & Creative North Star
**Creative North Star: "The Semantic Architect"**
This design system moves away from generic mobile layouts toward a high-end, editorial "IDE-inspired" experience. It treats Hinglish translation not just as a utility, but as a sophisticated linguistic experiment. 

The aesthetic is **Industrial Minimalism**: where the speed of Linear meets the structural clarity of Notion. We reject the "standard app" look by embracing intentional asymmetry, extreme typographic contrast, and a "No-Line" philosophy. The UI should feel like a high-performance laboratory instrument—precise, cold, yet incredibly powerful.

---

## 2. Colors & Surface Philosophy
The palette is rooted in deep midnight tones and neon-sharp accents to emphasize a "developer-first" environment.

### The "No-Line" Rule
**Prohibit 1px solid borders for sectioning.** 
Structural boundaries are defined exclusively through background color shifts. A `surface-container-low` section sitting on a `surface` background provides all the separation a user needs. If you feel the urge to draw a line, use a margin instead.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of tinted glass. Use the hierarchy below to define importance:
*   **Base Layer:** `surface` (#0b1326) — The laboratory floor.
*   **Secondary Context:** `surface-container` (#171f33) — Nav bars and sidebars.
*   **Interaction Cards:** `surface-container-high` (#222a3d) — The primary workspace.
*   **Elevated Modals:** `surface-container-highest` (#2d3449) — Temporary floating tools.

### The Glass & Gradient Rule
To move beyond a "flat" feel, floating elements (like FABs or Tooltips) must use **Glassmorphism**: `surface-variant` with a 60% opacity and a 20px backdrop-blur. 
*   **Signature Textures:** For primary CTAs, use a linear gradient: `primary_container` (#00e5ff) to `primary` (#c3f5ff) at a 135-degree angle. This adds a "lithium-ion" glow that feels alive.

---

## 3. Typography
We use a tri-font system to create a sophisticated editorial hierarchy.

*   **Display & Headlines (Manrope):** Chosen for its geometric precision. Use `display-lg` (3.5rem) with tight letter-spacing (-0.04em) for hero moments. It conveys authority.
*   **Body & Titles (Inter):** The workhorse. Inter provides maximum readability for long-form Hinglish/English strings. `body-md` (0.875rem) is the standard for translation outputs.
*   **Labels & Metadata (Space Grotesk):** This is our "Industrial" signature. Use `label-md` (0.75rem) in all-caps for technical metadata (e.g., "LATENCY: 12ms" or "ENGINE: V2-NEURAL").

---

## 4. Elevation & Depth
In this system, depth is a function of **Tonal Layering**, not shadows.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section to create a soft, natural lift. This "recessed" look feels more premium than high-contrast drop shadows.
*   **Ambient Shadows:** If an element must float (e.g., a context menu), use an extra-diffused shadow: `offset-y: 12px, blur: 40px, color: rgba(0, 218, 243, 0.08)`. This mimics the glow of the screen itself.
*   **The "Ghost Border":** For accessibility in high-density areas, use a "Ghost Border": `outline-variant` (#3b494c) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons
*   **Primary:** Gradient-filled (`primary_container` to `primary`). 16px (`xl`) corner radius. Subtle inner-glow (1px white overlay at 10% opacity) on the top edge.
*   **Secondary:** Ghost-style. No background. `primary` text. `label-md` (Space Grotesk) font for a technical feel.
*   **Tertiary:** `surface-container-highest` background with `on-surface` text.

### Cards & Lists
*   **Rule:** Forbid divider lines.
*   **Implementation:** Use `8 (2rem)` spacing to separate list items. To group items, wrap them in a `surface-container-low` parent container with `20px` rounded corners.
*   **Hinglish Input Card:** Use `surface-container-lowest` for the input area to create a "sink" effect, signaling to the user that this is where data is poured in.

### Technical Chips
*   Used for language tags (e.g., "HIN", "ENG").
*   Styling: `surface-variant` background, `label-sm` text, `4px` (sm) corner radius. Monospaced feel.

### Additional Lab Components
*   **The Terminal Output:** A specialized card using a monospace font for raw JSON or developer logs, utilizing `surface_container_highest` to differentiate from user-facing text.
*   **The Progress Micro-Bar:** A 2px high bar using the `secondary` (#d2bbff) accent color to show translation progress without cluttering the screen.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical margins (e.g., 24px left, 16px right) on headline elements to create an editorial, "Notion-plus" feel.
*   **Do** leverage `primary_fixed_dim` for icons to ensure they don't overpower the text.
*   **Do** use `8pt grid` increments for all padding: `8, 16, 24, 32, 40, 48`.

### Don't:
*   **Don't** use pure black (#000000) or pure white (#FFFFFF). Use our specific `surface` and `on-surface` tokens to maintain the industrial tint.
*   **Don't** use standard "Material Design" shadows. They are too heavy for this system’s "Laboratory" aesthetic.
*   **Don't** use center-alignment for text blocks. Stick to left-aligned (Architectural) layout patterns to maintain the developer-friendly vibe.