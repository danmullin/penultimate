# Penultimate

Handles worth dragging.

Web-based SVG-first vector editor (Illustrator-lite). Formerly known as Anchor Management.

## Live app (auto-updates)

Every push to `main` deploys via GitHub Actions → GitHub Pages:

**https://danmullin.github.io/penultimate/**

Share that link with your brother — refresh the page to get the latest build. No zip / Messenger dance required.

## Develop

Install dependencies and start the Vite dev server:

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Requires **Node.js** (18+ recommended). On Windows, run these from the project folder in PowerShell or your terminal.

### Local clone updates

```bash
git pull
npm install
npm run dev
```

After changing features or shortcuts, update `src/data/features.json` and run:

```bash
npm run sync:readme
```

That keeps the README and the in-app Help panel (`?` / `F1`) aligned.

## Features & shortcuts

`Ctrl` is `Cmd` on macOS.

### Tools

| Feature | Shortcut / notes |
|---------|------------------|
| Selection | V |
| Direct Selection | A |
| Pen | P |
| Pencil | N |
| Scissors | C |
| Eyedropper | I |
| Type | T |
| Area Type | Shift+T |
| Line | L |
| Rectangle | R |
| Rounded Rectangle | U |
| Ellipse | O |
| Polygon | Y |
| Star | J |
| Shear | S |
| Zoom | Z — Click zoom in · Alt/Shift+click zoom out |

### Edit

| Feature | Shortcut / notes |
|---------|------------------|
| Undo | Ctrl+Z |
| Redo | Ctrl+Y / Ctrl+Shift+Z |
| Copy | Ctrl+C |
| Paste | Ctrl+V |
| Duplicate | Ctrl+D |
| Group | Ctrl+G |
| Ungroup | Ctrl+Shift+G |
| Delete selection | Delete / Backspace |
| Reset fill/stroke to default | D — White fill · black stroke · 1px (Illustrator-style) |
| Nudge 1px | Arrow keys |
| Nudge 10px | Shift+Arrow keys |
| Clear selection / cancel | Esc |

### View & Zoom

| Feature | Shortcut / notes |
|---------|------------------|
| Zoom in | Ctrl+= · Ctrl+scroll |
| Zoom out | Ctrl+- · Ctrl+scroll |
| Fit artboard | Ctrl+0 |
| Zoom 100% | Ctrl+1 |
| Outline mode | ` (backtick) |
| Show rulers | Preferences or View toolbar |
| Show grid / snap / smart guides | Preferences (Ctrl+, / Ctrl+K) |
| Collapsible panels | Click Appearance / Layers / Swatches headers |
| Movable dialogs | Drag Preferences, Help, Color Picker, or shape dialogs by the title bar |

### Drawing

| Feature | Notes |
|---------|-------|
| Draw over existing objects | With nothing selected, shape/pen tools click through objects |
| Exact-size shape dialog | Click (no drag) with a shape tool — set width/height/sides/etc. |
| Instant tooltips | Hover toolbar buttons — no native delay |
| Wrapping control bar | Top bar wraps instead of scrolling sideways |

### Pen & Paths

| Feature | Shortcut / notes |
|---------|------------------|
| Finish path (open) | Enter |
| Close path | Double-click · click first point |
| Cancel path | Esc |
| Join paths | Control bar |
| Outline stroke / Offset path | Control bar |
| Path anchors (Direct Select) | Drag · double-click convert · right-click delete · Shift+right-click add |

### Arrange & Transform

| Feature | Notes |
|---------|-------|
| Bring to front / Send to back | Control bar |
| Reflect H / V | Control bar |
| Shear H / V | Control bar or Shear tool |
| Align & distribute | Control bar (optional align to artboard) |
| Aspect lock | Control bar · Shift while scaling also locks |
| Move / resize / rotate | Selection handles |

### Pathfinder & Masks

| Feature | Notes |
|---------|-------|
| Unite / Subtract / Intersect / Exclude | Control bar |
| Divide / Trim | Control bar |
| Clipping mask make / release | Control bar |

### Appearance

| Feature | Notes |
|---------|-------|
| Default appearance | Shapes: white fill · black stroke · 1px. Type: black fill · no stroke |
| Shape geometry | Appearance → Shape — width/height, corners, polygon sides, star radii, line length |
| Compact Appearance panel | Collapsible sections — Paint, Stroke, Object, Type |
| Fill & stroke (solid / gradient / none) | Appearance panel |
| Stroke width, cap, join, dash, arrow, align | Appearance panel |
| Opacity, blend modes, drop shadow | Appearance panel |
| Text style (font, size, bold, italic) | Appearance panel when text selected |
| Font picker ↑/↓ | Arrow keys step fonts in list or search field |
| Color picker | In-app Photoshop-style picker (no OS color panel) — OK keeps · Cancel/Esc reverts · live preview while open |
| Swatch library | Own dock panel — click fill · Shift+click stroke · well opens picker · Add saves to library (stays open) |

### Document

| Feature | Shortcut / notes |
|---------|------------------|
| Multi-artboard + size / background | Control bar |
| Layers (visibility, lock, reorder, rename) | Layers panel — drag rows to reorder |
| Rulers + manual guides | Drag from ruler onto canvas |
| Soft-save / draft recovery | Silent IndexedDB draft — restores after tab close |
| Open / Save project | Menu bar (.vector.json) |
| Import SVG / Place image | Menu bar |
| Export SVG / PNG | Menu bar |
| UI themes | Menu bar or Preferences — Coffee, Synthwave, Illustrator, Paper, Nord, … |
| Preferences | Ctrl+, / Ctrl+K |
| Keyboard shortcuts help | F1 / ? |

In the app, open the same list from the **?** button in the menu bar (source: `src/data/features.json`).

## Project format

`.vector.json` with `version: 1`, artboards, settings, `nodes` map, top-level `zOrder`, document `swatches`, and `manualGuides`.
