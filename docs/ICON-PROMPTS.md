# Penultimate — Icon generation prompts (Wave 0)

Replace CSS glyphs with custom icons. Prefer **SVG**. Filename = icon id (e.g. `tool-select.svg`). Drop into `public/icons/`.

## Style lock (paste before every prompt)

> App UI toolbar icon for “Penultimate”, a web vector editor. Flat monochrome glyph, single color near-black (#1a1a1a) on transparent background. Geometric, clean, slightly playful but professional — like a modern design-tool icon, not skeuomorphic, not emoji, not 3D, not glossy. Centered in a square canvas. Generous padding so the shape reads at 16–20px. No text, no words, no brand logo. Simple line weight ~2px optical. Square composition 512×512 or 1:1.

## Tips

- Generate `tool-select` first; reuse as style reference.
- Prefer SVG; PNG OK at 512² with transparency.
- Skip color variants — UI tints via `currentColor`.
- Built-in starter set already lives in `public/icons/` (regenerate anytime with `node tools/gen_icons.js`). Swap in your custom art over those files when ready.

## Current UI icons (1–43)

| # | Filename | Prompt (append after style lock) |
|---|----------|----------------------------------|
| 1 | `open` | Folder with a small upward arrow or open flap — “open document” |
| 2 | `save` | Floppy-disk silhouette, simplified geometric |
| 3 | `export-svg` | Document page with corner fold + tiny path/curve mark |
| 4 | `export-png` | Document page with corner fold + tiny grid/pixel square |
| 5 | `undo` | Curved arrow bending left/counterclockwise |
| 6 | `redo` | Curved arrow bending right/clockwise |
| 7 | `group` | Two overlapping rounded rectangles bound by a light bracket |
| 8 | `ungroup` | Two rounded rectangles with a broken/open bracket |
| 9 | `align-left` | Vertical guide line on left + three horizontal bars left-aligned |
| 10 | `align-h-center` | Vertical center guide + three bars centered |
| 11 | `align-right` | Vertical guide on right + three bars right-aligned |
| 12 | `align-top` | Horizontal guide on top + three vertical bars top-aligned |
| 13 | `align-v-center` | Horizontal center guide + three bars middle-aligned |
| 14 | `align-bottom` | Horizontal guide on bottom + three bars bottom-aligned |
| 15 | `dist-h` | Three vertical bars with equal spacing arrows between |
| 16 | `dist-v` | Three horizontal bars with equal spacing arrows between |
| 17 | `check` | Simple checkmark |
| 18 | `cancel` | Simple X / cross |
| 19 | `snap` | Small grid with a magnet or snap-dot on an intersection |
| 20 | `guides` | Two thin dashed guide lines crossing with a center point |
| 21 | `visible` | Open eye |
| 22 | `hidden` | Eye with a diagonal slash |
| 23 | `locked` | Closed padlock |
| 24 | `unlocked` | Open padlock |
| 25 | `up` | Bold upward chevron / arrow |
| 26 | `down` | Bold downward chevron / arrow |
| 27 | `delete` | Trash can, simple geometric |
| 28 | `paint-none` | Square outline with a diagonal slash |
| 29 | `paint-solid` | Solid filled square |
| 30 | `paint-linear` | Square with monochrome left-to-right gradient hatching |
| 31 | `paint-radial` | Square with concentric rings suggesting radial fill |
| 32 | `stroke-center` | Thick outlined circle with stroke straddling the path |
| 33 | `stroke-inside` | Circle with thick stroke clearly inside the path |
| 34 | `stroke-outside` | Circle with thick stroke clearly outside the path |
| 35 | `angle-h` | Horizontal double-headed arrow |
| 36 | `angle-v` | Vertical double-headed arrow |
| 37 | `angle-diag` | Diagonal double-headed arrow corner to corner |
| 38 | `tool-select` | Classic filled cursor/arrow pointer (black arrow tool) |
| 39 | `tool-pen` | Fountain-pen nib / Bézier pen tip |
| 40 | `tool-text` | Capital letter T |
| 41 | `tool-line` | Diagonal line with dots/squares at both ends |
| 42 | `tool-rect` | Rectangle outline |
| 43 | `tool-ellipse` | Ellipse / circle outline |

## Wave 1 icons (44–69)

| # | Filename | Prompt (append after style lock) |
|---|----------|----------------------------------|
| 44 | `tool-direct` | Hollow/white arrow pointer (anchor-point selection tool) |
| 45 | `tool-rounded-rect` | Rectangle outline with clearly rounded corners |
| 46 | `tool-polygon` | Regular hexagon outline |
| 47 | `tool-star` | Five-point star outline |
| 48 | `pathfinder-unite` | Two overlapping circles merged into one silhouette |
| 49 | `pathfinder-subtract` | Two overlapping circles with front bite removed from back |
| 50 | `pathfinder-intersect` | Only the overlapping lens of two circles filled |
| 51 | `pathfinder-exclude` | Two overlapping circles with overlap empty (XOR) |
| 52 | `cap-butt` | Thick horizontal stroke ending in a flat cut |
| 53 | `cap-round` | Thick horizontal stroke ending in a semicircle |
| 54 | `cap-square` | Thick horizontal stroke ending in a square projecting past the tip |
| 55 | `join-miter` | Two thick strokes meeting in a sharp pointed corner |
| 56 | `join-round` | Two thick strokes meeting in a rounded corner |
| 57 | `join-bevel` | Two thick strokes meeting in a chopped flat corner |
| 58 | `dash` | Horizontal dashed line |
| 59 | `arrow-end` | Line with a simple triangle arrowhead on the right |
| 60 | `bring-front` | Stacked rectangles with top arrow / front card emphasized |
| 61 | `send-back` | Stacked rectangles with bottom arrow / back card emphasized |
| 62 | `align-artboard` | Small artboard frame with a centered object inside |
| 63 | `duplicate` | Two overlapping pages/squares offset (copy) |
| 64 | `import-svg` | Document with a downward arrow into the canvas |
| 65 | `bold` | Bold capital B |
| 66 | `italic` | Italic capital I |
| 67 | `add-anchor` | Path curve with a plus on an anchor |
| 68 | `delete-anchor` | Path curve with a minus on an anchor |
| 69 | `convert-anchor` | Anchor point with both corner and smooth handle cue |

## Wave 2+ icons (70–135) — unimplemented catalog

Icons for remaining Illustrator-catalog features (Wave 2 candidates + other Missing items). Skip/out-of-scope (Firefly, mesh, 3D, etc.) intentionally omitted.

### Tools

| # | Filename | Prompt (append after style lock) |
|---|----------|----------------------------------|
| 70 | `tool-pencil` | Pencil tip with a freehand scribble trail |
| 71 | `tool-eyedropper` | Classic eyedropper / pipette angled diagonally |
| 72 | `tool-lasso` | Freeform lasso loop with a small handle tip |
| 73 | `tool-curvature` | Soft S-curve with three visible anchor dots |
| 74 | `tool-paintbrush` | Paintbrush tip with a short stroke flare |
| 75 | `tool-smooth` | Jagged path fading into a smooth curve |
| 76 | `tool-path-eraser` | Path segment with an eraser tip cutting it |
| 77 | `tool-scissors` | Scissors open over a cut line |
| 78 | `tool-knife` | Knife blade cutting through a shape |
| 79 | `tool-join` | Two path ends meeting at a shared anchor |
| 80 | `tool-arc` | Circular arc with endpoint anchors |
| 81 | `tool-shape-builder` | Two overlapping squares with a plus in a region |
| 82 | `tool-hand` | Open hand / pan gesture silhouette |
| 83 | `tool-zoom` | Magnifying glass with a plus inside |
| 84 | `tool-gradient` | Horizontal gradient bar with two stop dots |
| 85 | `tool-artboard` | Rectangle frame with corner crop handles |
| 86 | `tool-rotate` | Small square with a circular rotate arrow |
| 87 | `tool-scale` | Square with outward corner scale arrows |
| 88 | `tool-reflect` | Shape mirrored across a dashed center line |
| 89 | `tool-shear` | Parallelogram / skewed rectangle |
| 90 | `tool-free-transform` | Distorted quad with corner handle squares |
| 91 | `tool-area-text` | Capital T inside a text-frame rectangle |
| 92 | `tool-type-path` | Capital T sitting on a curved path |

### Pathfinder / path ops

| # | Filename | Prompt (append after style lock) |
|---|----------|----------------------------------|
| 93 | `pathfinder-divide` | Two overlapping squares with all region seams shown |
| 94 | `pathfinder-trim` | Overlap trimmed; back shape partially cut by front |
| 95 | `pathfinder-merge` | Overlapping shapes fused with internal edges removed |
| 96 | `pathfinder-crop` | Front shape filled; back only as crop context |
| 97 | `pathfinder-outline` | Overlapping outlines only, no fills |
| 98 | `outline-stroke` | Thick stroke converted to an outlined path ribbon |
| 99 | `offset-path` | Shape with a concentric expanded outline around it |
| 100 | `compound-path` | Filled ring / donut suggesting a hole compound path |
| 101 | `clip-mask` | Rectangle clipped by a circle mask cue |
| 102 | `opacity-mask` | Rectangle fading left-to-right (mask opacity) |

### Transform helpers

| # | Filename | Prompt (append after style lock) |
|---|----------|----------------------------------|
| 103 | `reflect-h` | Object mirrored left/right across a vertical dashed line |
| 104 | `reflect-v` | Object mirrored up/down across a horizontal dashed line |
| 105 | `flip-h` | Two triangles pointing outward from a vertical axis |
| 106 | `flip-v` | Two triangles pointing outward from a horizontal axis |
| 107 | `aspect-lock` | Square with a lock cue / linked aspect |
| 108 | `aspect-unlock` | Square with an open/unlocked aspect cue |
| 109 | `rotate-90` | Square with a 90° rotation arrow |
| 110 | `resize-edge` | Rectangle with mid-edge vertical resize arrows |

### Appearance / type / document

| # | Filename | Prompt (append after style lock) |
|---|----------|----------------------------------|
| 111 | `swatch` | 2×2 grid of color chips (monochrome values) |
| 112 | `pattern-fill` | Square filled with a simple hatch/pattern grid |
| 113 | `blend-mode` | Two overlapping translucent circles |
| 114 | `effect-shadow` | Shape with an offset shadow rectangle behind |
| 115 | `effect-blur` | Soft concentric rings suggesting blur |
| 116 | `graphic-style` | Style card / sheet with sample lines |
| 117 | `underline` | Underlined U |
| 118 | `align-text-left` | Three text lines left-aligned |
| 119 | `align-text-center` | Three text lines center-aligned |
| 120 | `align-text-right` | Three text lines right-aligned |
| 121 | `convert-outlines` | Letterform becoming a vector outline path |
| 122 | `font` | Capital A with typographic weight cue |
| 123 | `layer-folder` | Folder for nested layers |
| 124 | `isolation` | Dimmed artboard with one bright focused object |
| 125 | `symbol` | Square badge with a circled center mark |
| 126 | `artboards` | Two overlapping artboard frames |
| 127 | `outline-mode` | Wireframe cube / outlined object only |
| 128 | `pixel-preview` | Grid overlay suggesting pixel preview |
| 129 | `rulers` | L-shaped ruler along top and left |
| 130 | `place-image` | Image frame with mountain/sun photo mark |
| 131 | `copy` | Two overlapping documents (clipboard copy) |
| 132 | `paste` | Clipboard with pasted lines |
| 133 | `cut` | Scissors cutting (clipboard cut) |
| 134 | `export-pdf` | Document page with a small PDF-style mark |
| 135 | `nest-layers` | Indented tree lines suggesting nested layers |

**Total: 135 icons** (69 prior + 66 Wave 2+).

Regenerate anytime: `node tools/gen_icons.js`.

## Canvas mouse cursors (Illustrator-style)

Live tool cursors live in `public/cursors/` (not toolbar icons). Floating overlay via `ToolCursorOverlay` — CSS `cursor: url(svg)` is unreliable in Chromium.

Regenerate: `node tools/gen_cursors.js`

| File | Meaning |
|------|---------|
| `select` | Black arrow (V) |
| `direct` | White/hollow arrow (A) |
| `pen` | Pen nib |
| `pen-add` / `pen-remove` / `pen-close` | Pen variants (+ / − / close path) |
| `pencil` | Pencil tip |
| `eyedropper` | Pipette |
| `text` | Type I-beam / T |
| `line` `rect` `rounded-rect` `ellipse` `polygon` `star` | Crosshair + shape badge |
| `move` | 4-way move |
| `precision` | Fine crosshair |

Hotspots documented in `public/cursors/hotspots.json`.
