#!/usr/bin/env node
/**
 * Generate monochrome SVG toolbar icons into public/icons/
 * Usage: node tools/gen_icons.js
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '..', 'public', 'icons')

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '1.75',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
}

function attrs(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ')
}

function strokeSvg(inner) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ${attrs(STROKE)}>`,
    `  ${inner}`,
    `</svg>`,
    '',
  ].join('\n')
}

function fillSvg(inner) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">`,
    `  ${inner}`,
    `</svg>`,
    '',
  ].join('\n')
}

function mixedSvg(inner) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">`,
    `  ${inner}`,
    `</svg>`,
    '',
  ].join('\n')
}

/** @type {Record<string, string>} */
const ICONS = {
  // --- File / history ---
  open: strokeSvg(`
  <path d="M4 8V6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v2"/>
  <path d="M4 10h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8z"/>
`),

  save: strokeSvg(`
  <path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/>
  <path d="M8 4v5h7V4"/>
  <rect x="8" y="14" width="8" height="5" rx="0.5"/>
`),

  'export-svg': strokeSvg(`
  <path d="M12 4v10"/>
  <path d="M8 10l4 4 4-4"/>
  <path d="M5 18h14"/>
  <path d="M7 21h10"/>
`),

  'export-png': strokeSvg(`
  <rect x="4" y="5" width="16" height="14" rx="2"/>
  <circle cx="9" cy="10" r="1.5"/>
  <path d="M4 16l4-3 3 2 4-4 5 5"/>
`),

  undo: strokeSvg(`
  <path d="M8 8H4v4"/>
  <path d="M4 8c2.5-3.5 6-5 10-5a8 8 0 1 1-1 15.9"/>
`),

  redo: strokeSvg(`
  <path d="M16 8h4v4"/>
  <path d="M20 8c-2.5-3.5-6-5-10-5a8 8 0 1 0 1 15.9"/>
`),

  // --- Group / align / distribute ---
  group: strokeSvg(`
  <rect x="4" y="4" width="8" height="8" rx="1"/>
  <rect x="12" y="12" width="8" height="8" rx="1"/>
  <path d="M10 10h4v4"/>
`),

  ungroup: strokeSvg(`
  <rect x="3.5" y="3.5" width="7" height="7" rx="1"/>
  <rect x="13.5" y="13.5" width="7" height="7" rx="1"/>
  <path d="M11 9l2 2M13 9l-2 2" opacity="0.55"/>
`),

  'align-left': strokeSvg(`
  <path d="M4 4v16"/>
  <rect x="7" y="6" width="10" height="4" rx="0.5"/>
  <rect x="7" y="14" width="13" height="4" rx="0.5"/>
`),

  'align-h-center': strokeSvg(`
  <path d="M12 4v16"/>
  <rect x="6" y="6" width="12" height="4" rx="0.5"/>
  <rect x="8" y="14" width="8" height="4" rx="0.5"/>
`),

  'align-right': strokeSvg(`
  <path d="M20 4v16"/>
  <rect x="7" y="6" width="10" height="4" rx="0.5"/>
  <rect x="4" y="14" width="13" height="4" rx="0.5"/>
`),

  'align-top': strokeSvg(`
  <path d="M4 4h16"/>
  <rect x="6" y="7" width="4" height="10" rx="0.5"/>
  <rect x="14" y="7" width="4" height="13" rx="0.5"/>
`),

  'align-v-center': strokeSvg(`
  <path d="M4 12h16"/>
  <rect x="6" y="6" width="4" height="12" rx="0.5"/>
  <rect x="14" y="8" width="4" height="8" rx="0.5"/>
`),

  'align-bottom': strokeSvg(`
  <path d="M4 20h16"/>
  <rect x="6" y="7" width="4" height="10" rx="0.5"/>
  <rect x="14" y="4" width="4" height="13" rx="0.5"/>
`),

  'dist-h': strokeSvg(`
  <path d="M4 5v14"/>
  <path d="M20 5v14"/>
  <rect x="8" y="8" width="3" height="8" rx="0.5"/>
  <rect x="13" y="8" width="3" height="8" rx="0.5"/>
`),

  'dist-v': strokeSvg(`
  <path d="M5 4h14"/>
  <path d="M5 20h14"/>
  <rect x="8" y="8" width="8" height="3" rx="0.5"/>
  <rect x="8" y="13" width="8" height="3" rx="0.5"/>
`),

  // --- UI chrome ---
  check: strokeSvg(`
  <path d="M5 12.5l4.5 4.5L19 7"/>
`),

  cancel: strokeSvg(`
  <path d="M6 6l12 12M18 6L6 18"/>
`),

  snap: strokeSvg(`
  <path d="M12 4v4M12 16v4M4 12h4M16 12h4"/>
  <circle cx="12" cy="12" r="3"/>
`),

  guides: strokeSvg(`
  <path d="M4 8h16M4 16h16"/>
  <path d="M8 4v16M16 4v16"/>
`),

  visible: strokeSvg(`
  <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/>
  <circle cx="12" cy="12" r="2.75"/>
`).replace('stroke="currentColor"', 'stroke="#000"'),

  hidden: strokeSvg(`
  <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/>
  <circle cx="12" cy="12" r="2.75"/>
  <path d="M4.25 4.25l15.5 15.5"/>
`).replace('stroke="currentColor"', 'stroke="#000"'),

  locked: strokeSvg(`
  <rect x="5.5" y="11" width="13" height="9.5" rx="1.75"/>
  <path d="M8.25 11V8.25a3.75 3.75 0 0 1 7.5 0V11"/>
  <circle cx="12" cy="15.5" r="1.1" fill="#000" stroke="none"/>
`).replace('stroke="currentColor"', 'stroke="#000"'),

  unlocked: strokeSvg(`
  <rect x="5.5" y="11" width="13" height="9.5" rx="1.75"/>
  <path d="M8.25 11V8.25a3.75 3.75 0 0 1 7.5 0"/>
  <circle cx="12" cy="15.5" r="1.1" fill="#000" stroke="none"/>
`).replace('stroke="currentColor"', 'stroke="#000"'),

  up: strokeSvg(`
  <path d="M12 19V5"/>
  <path d="M6 11l6-6 6 6"/>
`),

  down: strokeSvg(`
  <path d="M12 5v14"/>
  <path d="M6 13l6 6 6-6"/>
`),

  delete: strokeSvg(`
  <path d="M5 7h14"/>
  <path d="M9 7V5h6v2"/>
  <path d="M7 7l1 13h8l1-13"/>
  <path d="M10 11v5M14 11v5"/>
`),

  // --- Paint fills ---
  'paint-none': strokeSvg(`
  <rect x="5" y="5" width="14" height="14" rx="1.5"/>
  <path d="M6.5 17.5L17.5 6.5"/>
`),

  'paint-solid': fillSvg(`
  <rect x="5" y="5" width="14" height="14" rx="1.5"/>
`),

  'paint-linear': mixedSvg(`
  <defs>
    <linearGradient id="lg" x1="5" y1="12" x2="19" y2="12" gradientUnits="userSpaceOnUse">
      <stop stop-color="currentColor" stop-opacity="0.15"/>
      <stop offset="1" stop-color="currentColor"/>
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="14" height="14" rx="1.5" fill="url(#lg)" stroke="currentColor" stroke-width="1.75"/>
`),

  'paint-radial': mixedSvg(`
  <defs>
    <radialGradient id="rg" cx="12" cy="12" r="7" gradientUnits="userSpaceOnUse">
      <stop stop-color="currentColor" stop-opacity="0.12"/>
      <stop offset="1" stop-color="currentColor"/>
    </radialGradient>
  </defs>
  <rect x="5" y="5" width="14" height="14" rx="1.5" fill="url(#rg)" stroke="currentColor" stroke-width="1.75"/>
`),

  // --- Stroke align ---
  'stroke-center': strokeSvg(`
  <rect x="5" y="5" width="14" height="14" rx="1.5" stroke-width="3"/>
  <rect x="5" y="5" width="14" height="14" rx="1.5" stroke-dasharray="2 2" opacity="0.35" stroke-width="1"/>
`),

  'stroke-inside': mixedSvg(`
  <rect x="5" y="5" width="14" height="14" rx="1.5" fill="none" stroke="currentColor" stroke-width="1" opacity="0.35"/>
  <rect x="7" y="7" width="10" height="10" rx="1" fill="none" stroke="currentColor" stroke-width="2.5"/>
`),

  'stroke-outside': mixedSvg(`
  <rect x="7.5" y="7.5" width="9" height="9" rx="1" fill="none" stroke="currentColor" stroke-width="1" opacity="0.35"/>
  <rect x="4.5" y="4.5" width="15" height="15" rx="1.5" fill="none" stroke="currentColor" stroke-width="2.5"/>
`),

  // --- Angle / constrain ---
  'angle-h': strokeSvg(`
  <path d="M4 12h16"/>
  <path d="M8 8l-4 4 4 4"/>
  <path d="M16 8l4 4-4 4"/>
`),

  'angle-v': strokeSvg(`
  <path d="M12 4v16"/>
  <path d="M8 8l4-4 4 4"/>
  <path d="M8 16l4 4 4-4"/>
`),

  'angle-diag': strokeSvg(`
  <path d="M5 19L19 5"/>
  <path d="M14 5h5v5"/>
  <path d="M10 19H5v-5"/>
`),

  // --- Tools ---
  'tool-select': fillSvg(`
  <path d="M6 3.5 V18.5 L10.25 14.25 L13.75 21.25 L16.75 19.75 L13.25 12.75 H20.5 Z"/>
`),

  'tool-direct': strokeSvg(`
  <path d="M6 3.75 L6 17.75 L10.25 13.75 L13.5 20.75 L16.25 19.25 L13 12.25 H19.75 Z"/>
`),

  'tool-pen': strokeSvg(`
  <path d="M14.5 4.5l5 5L9 20H4v-5L14.5 4.5z"/>
  <path d="M12.5 6.5l5 5"/>
`),

  'tool-text': strokeSvg(`
  <path d="M6 6h12"/>
  <path d="M12 6v14"/>
  <path d="M9 20h6"/>
`),

  'tool-line': strokeSvg(`
  <path d="M5 19L19 5"/>
`),

  'tool-rect': strokeSvg(`
  <rect x="5" y="6" width="14" height="12" rx="0.5"/>
`),

  'tool-ellipse': strokeSvg(`
  <ellipse cx="12" cy="12" rx="8" ry="6"/>
`),

  'tool-rounded-rect': strokeSvg(`
  <rect x="5" y="6" width="14" height="12" rx="3.5"/>
`),

  'tool-polygon': strokeSvg(`
  <path d="M12 3.5l7.5 5.5-2.9 8.9H7.4L4.5 9z"/>
`),

  'tool-star': strokeSvg(`
  <path d="M12 3.5l2.2 5.6h5.8l-4.7 3.5 1.8 5.7L12 14.8l-5.1 3.5 1.8-5.7-4.7-3.5h5.8z"/>
`),

  // --- Pathfinder ---
  'pathfinder-unite': fillSvg(`
  <path d="M5 5h9v5h5v9H10v-5H5V5z" fill-rule="evenodd"/>
`),

  'pathfinder-subtract': mixedSvg(`
  <path d="M5 5h14v14H5z" fill="currentColor" opacity="0.25"/>
  <path d="M10 10h9v9H10z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>
  <path d="M5 5h9v5H5z" fill="currentColor"/>
  <path d="M5 10h5v5H5z" fill="currentColor"/>
`),

  'pathfinder-intersect': mixedSvg(`
  <rect x="4" y="4" width="11" height="11" rx="0.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <rect x="9" y="9" width="11" height="11" rx="0.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <rect x="9" y="9" width="6" height="6" fill="currentColor"/>
`),

  'pathfinder-exclude': mixedSvg(`
  <path fill="currentColor" fill-rule="evenodd" d="M5 5h9v5h5v9H10v-5H5V5zm5 5h4v4h-4z"/>
`),

  // --- Caps / joins ---
  'cap-butt': strokeSvg(`
  <path d="M5 12h10" stroke-width="5" stroke-linecap="butt"/>
  <path d="M15 7v10" stroke-width="1.25" opacity="0.45"/>
`),

  'cap-round': strokeSvg(`
  <path d="M5 12h10" stroke-width="5" stroke-linecap="round"/>
`),

  'cap-square': strokeSvg(`
  <path d="M5 12h10" stroke-width="5" stroke-linecap="square"/>
`),

  'join-miter': strokeSvg(`
  <path d="M5 18V8h10" stroke-width="4" stroke-linejoin="miter" stroke-linecap="butt"/>
`),

  'join-round': strokeSvg(`
  <path d="M5 18V8h10" stroke-width="4" stroke-linejoin="round" stroke-linecap="butt"/>
`),

  'join-bevel': strokeSvg(`
  <path d="M5 18V8h10" stroke-width="4" stroke-linejoin="bevel" stroke-linecap="butt"/>
`),

  dash: strokeSvg(`
  <path d="M4 12h3M10 12h3M16 12h4" stroke-dasharray="0"/>
`),

  'arrow-end': strokeSvg(`
  <path d="M4 12h12"/>
  <path d="M12 7l6 5-6 5"/>
`),

  // --- Stacking / artboard ---
  'bring-front': strokeSvg(`
  <rect x="5" y="8" width="10" height="10" rx="1" opacity="0.4"/>
  <rect x="9" y="4" width="10" height="10" rx="1"/>
`),

  'send-back': strokeSvg(`
  <rect x="9" y="4" width="10" height="10" rx="1" opacity="0.4"/>
  <rect x="5" y="8" width="10" height="10" rx="1"/>
`),

  'align-artboard': strokeSvg(`
  <rect x="4" y="4" width="16" height="16" rx="1.5"/>
  <rect x="8" y="9" width="8" height="6" rx="0.5"/>
`),

  duplicate: strokeSvg(`
  <rect x="8" y="8" width="11" height="11" rx="1.5"/>
  <path d="M14 8V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v6.5A1.5 1.5 0 0 0 6 14h2"/>
`),

  'import-svg': strokeSvg(`
  <path d="M12 14V4"/>
  <path d="M8 8l4-4 4 4"/>
  <path d="M5 18h14"/>
  <path d="M7 21h10"/>
`),

  // --- Type ---
  bold: strokeSvg(`
  <path d="M8 5h5.5a3.5 3.5 0 0 1 0 7H8V5z"/>
  <path d="M8 12h6.5a3.5 3.5 0 0 1 0 7H8v-7z"/>
`),

  italic: strokeSvg(`
  <path d="M10 5h8"/>
  <path d="M6 19h8"/>
  <path d="M14 5l-4 14"/>
`),

  // --- Anchors ---
  'add-anchor': strokeSvg(`
  <path d="M5 17c3-7 6-10 7-11 1 1 4 4 7 11"/>
  <path d="M12 9v6M9 12h6"/>
  <circle cx="12" cy="6" r="1.75" fill="currentColor" stroke="none"/>
`),

  'delete-anchor': strokeSvg(`
  <path d="M5 17c3-7 6-10 7-11 1 1 4 4 7 11"/>
  <path d="M9.5 12h5"/>
  <circle cx="12" cy="6" r="1.75" fill="currentColor" stroke="none"/>
`),

  'convert-anchor': strokeSvg(`
  <path d="M5 17c2-5 4.5-8 7-10"/>
  <path d="M12 7c2.5 2 5 5 7 10"/>
  <path d="M7 4l5 3 5-3"/>
  <circle cx="12" cy="7" r="1.75" fill="currentColor" stroke="none"/>
  <circle cx="5" cy="17" r="1.5" fill="currentColor" stroke="none"/>
  <circle cx="19" cy="17" r="1.5" fill="currentColor" stroke="none"/>
`),

  // --- Wave 2+ tools ---
  'tool-pencil': strokeSvg(`
  <path d="M12 20h9"/>
  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
`),

  'tool-eyedropper': strokeSvg(`
  <path d="m2 22 1-1h3l9-9"/>
  <path d="M3 21v-3l9-9"/>
  <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z"/>
`),

  'tool-lasso': strokeSvg(`
  <path d="M8 16c-2-1-3-3-3-5 0-3.5 3.5-6.5 7-6.5s7 3 7 6.5c0 2.2-1.2 4-3 5"/>
  <path d="M8 16c1.5 2 3.5 3.5 4 4.5"/>
  <circle cx="12" cy="20.5" r="1" fill="currentColor" stroke="none"/>
`),

  'tool-curvature': strokeSvg(`
  <path d="M4 16c3-10 6-10 8-4s5 6 8 0"/>
  <circle cx="4" cy="16" r="1.6" fill="currentColor" stroke="none"/>
  <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/>
  <circle cx="20" cy="12" r="1.6" fill="currentColor" stroke="none"/>
`),

  'tool-paintbrush': strokeSvg(`
  <path d="M7 17c1.5-3 3-5 5-6l5-5 3 3-5 5c-1 2-3 3.5-6 4.5-1 .4-2.2-.6-2-1.5z"/>
  <path d="M14 8l2 2"/>
`),

  'tool-smooth': strokeSvg(`
  <path d="M4 16c2-1 3 2 5 1s3-4 5-3 3 3 5 2 2-3 1-4" opacity="0.4"/>
  <path d="M4 14c3-6 6-6 8-2s5 4 8-1"/>
`),

  'tool-path-eraser': strokeSvg(`
  <path d="M4 14c3-1 5 2 8 1s4-3 8-1" opacity="0.4"/>
  <path d="M14 6l4 4-5 5H9l-1-1 6-8z"/>
  <path d="M9 15h4"/>
`),

  'tool-scissors': strokeSvg(`
  <circle cx="6" cy="6" r="2.75"/>
  <circle cx="6" cy="18" r="2.75"/>
  <path d="M8.2 7.8 L20 19"/>
  <path d="M8.2 16.2 L20 5"/>
  <circle cx="12" cy="12" r="1.1"/>
`),

  'tool-knife': strokeSvg(`
  <path d="M5 19L15 5l3 3-6 10H8z"/>
  <path d="M15 5l2-2 3 3-2 2"/>
`),

  'tool-join': strokeSvg(`
  <path d="M4 8c4 0 5 4 8 4"/>
  <path d="M12 12c3 0 4-4 8-4"/>
  <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>
`),

  'tool-arc': strokeSvg(`
  <path d="M5 17A8 8 0 0 1 19 17"/>
  <circle cx="5" cy="17" r="1.5" fill="currentColor" stroke="none"/>
  <circle cx="19" cy="17" r="1.5" fill="currentColor" stroke="none"/>
`),

  'tool-shape-builder': mixedSvg(`
  <rect x="4" y="4" width="10" height="10" rx="0.5" fill="none" stroke="currentColor" stroke-width="1.75"/>
  <rect x="10" y="10" width="10" height="10" rx="0.5" fill="none" stroke="currentColor" stroke-width="1.75"/>
  <path d="M11 7h2M12 6v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <rect x="10" y="10" width="4" height="4" fill="currentColor" opacity="0.35"/>
`),

  'tool-hand': strokeSvg(`
  <path d="M8 11V8.5a1.5 1.5 0 0 1 3 0V11"/>
  <path d="M11 10.5V7.5a1.5 1.5 0 0 1 3 0V11"/>
  <path d="M14 10.5V8.5a1.5 1.5 0 0 1 3 0V14c0 3-2 5-5 5h-1c-3 0-5-2-5-5v-3a1.5 1.5 0 0 1 3 0"/>
`),

  'tool-zoom': strokeSvg(`
  <circle cx="11" cy="11" r="6"/>
  <path d="M16 16l4 4"/>
  <path d="M11 8v6M8 11h6"/>
`),

  'tool-gradient': mixedSvg(`
  <defs>
    <linearGradient id="tg" x1="4" y1="12" x2="20" y2="12" gradientUnits="userSpaceOnUse">
      <stop stop-color="currentColor" stop-opacity="0.15"/>
      <stop offset="1" stop-color="currentColor"/>
    </linearGradient>
  </defs>
  <rect x="4" y="8" width="16" height="8" rx="1" fill="url(#tg)" stroke="currentColor" stroke-width="1.75"/>
  <circle cx="7" cy="12" r="1.5" fill="currentColor"/>
  <circle cx="17" cy="12" r="1.5" fill="currentColor"/>
`),

  'tool-artboard': strokeSvg(`
  <rect x="5" y="5" width="14" height="14" rx="1"/>
  <path d="M5 5h2M5 5v2M19 5h-2M19 5v2M5 19h2M5 19v-2M19 19h-2M19 19v-2"/>
`),

  'tool-rotate': strokeSvg(`
  <rect x="8" y="8" width="8" height="8" rx="1"/>
  <path d="M16 6a7 7 0 1 0 2 5"/>
  <path d="M16 6h3v3"/>
`),

  'tool-scale': strokeSvg(`
  <rect x="7" y="7" width="10" height="10" rx="1"/>
  <path d="M5 5l3 3M5 5h3M5 5v3"/>
  <path d="M19 19l-3-3M19 19h-3M19 19v-3"/>
`),

  'tool-reflect': strokeSvg(`
  <path d="M12 4v16" stroke-dasharray="2 2"/>
  <path d="M10 8L5 12l5 4"/>
  <path d="M14 8l5 4-5 4" opacity="0.45"/>
`),

  'tool-shear': strokeSvg(`
  <path d="M7 19L11 5h6l-4 14H7z"/>
`),

  'tool-free-transform': strokeSvg(`
  <path d="M7 8l10-2 2 10-10 3z"/>
  <rect x="5.5" y="6.5" width="3" height="3" rx="0.4"/>
  <rect x="15.5" y="4.5" width="3" height="3" rx="0.4"/>
  <rect x="17.5" y="14.5" width="3" height="3" rx="0.4"/>
  <rect x="5.5" y="17.5" width="3" height="3" rx="0.4"/>
`),

  'tool-area-text': strokeSvg(`
  <rect x="4" y="5" width="16" height="14" rx="1.5"/>
  <path d="M8 9h8M12 9v8M10 17h4"/>
`),

  'tool-type-path': strokeSvg(`
  <path d="M4 16c4-8 8-8 12-2s4 6 4 6"/>
  <path d="M10 7h6M13 7v5M11.5 12h3"/>
`),

  // --- Advanced pathfinder ---
  'pathfinder-divide': mixedSvg(`
  <rect x="4" y="4" width="11" height="11" rx="0.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <rect x="9" y="9" width="11" height="11" rx="0.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <path d="M9 4v5M4 9h5M15 9v5M9 15h5" stroke="currentColor" stroke-width="1.25"/>
`),

  'pathfinder-trim': mixedSvg(`
  <rect x="4" y="4" width="12" height="12" rx="0.5" fill="currentColor" opacity="0.25"/>
  <rect x="10" y="10" width="10" height="10" rx="0.5" fill="none" stroke="currentColor" stroke-width="1.75"/>
  <path d="M10 10h6v6" fill="none" stroke="currentColor" stroke-width="1.75"/>
`),

  'pathfinder-merge': fillSvg(`
  <path d="M5 5h8v4h6v10H9v-4H5V5z"/>
`),

  'pathfinder-crop': mixedSvg(`
  <rect x="4" y="4" width="12" height="12" rx="0.5" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"/>
  <rect x="9" y="9" width="11" height="11" rx="0.5" fill="currentColor"/>
`),

  'pathfinder-outline': strokeSvg(`
  <rect x="4" y="4" width="11" height="11" rx="0.5"/>
  <rect x="9" y="9" width="11" height="11" rx="0.5"/>
`),

  // --- Path ops ---
  'outline-stroke': mixedSvg(`
  <path d="M5 17L17 5" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity="0.25"/>
  <path d="M5 17L17 5" fill="none" stroke="currentColor" stroke-width="1.75"/>
  <path d="M6.5 15.5c1.5-1.5 2-2 4-3.5" fill="none" stroke="currentColor" stroke-width="1.25"/>
`),

  'offset-path': strokeSvg(`
  <rect x="7" y="7" width="10" height="10" rx="1.5"/>
  <rect x="4" y="4" width="16" height="16" rx="2.5" opacity="0.45"/>
`),

  'compound-path': fillSvg(`
  <path fill-rule="evenodd" d="M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm0 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/>
`),

  'clip-mask': mixedSvg(`
  <rect x="4" y="6" width="12" height="12" rx="1" fill="currentColor" opacity="0.3"/>
  <circle cx="14" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="1.75"/>
  <path d="M14 8v8M10 12h8" stroke="currentColor" stroke-width="1.25" opacity="0.5"/>
`),

  'opacity-mask': mixedSvg(`
  <defs>
    <linearGradient id="om" x1="4" y1="12" x2="20" y2="12" gradientUnits="userSpaceOnUse">
      <stop stop-color="currentColor"/>
      <stop offset="1" stop-color="currentColor" stop-opacity="0.1"/>
    </linearGradient>
  </defs>
  <rect x="4" y="5" width="16" height="14" rx="1.5" fill="url(#om)" stroke="currentColor" stroke-width="1.75"/>
`),

  // --- Transform helpers ---
  'reflect-h': strokeSvg(`
  <path d="M12 4v16" stroke-dasharray="2 2"/>
  <path d="M10 7H6v10h4"/>
  <path d="M14 7h4v10h-4" opacity="0.45"/>
`),

  'reflect-v': strokeSvg(`
  <path d="M4 12h16" stroke-dasharray="2 2"/>
  <path d="M7 10V6h10v4"/>
  <path d="M7 14v4h10v-4" opacity="0.45"/>
`),

  'flip-h': strokeSvg(`
  <path d="M12 4v16"/>
  <path d="M10 8L5 12l5 4V8z"/>
  <path d="M14 8l5 4-5 4V8z"/>
`),

  'flip-v': strokeSvg(`
  <path d="M4 12h16"/>
  <path d="M8 10L12 5l4 5H8z"/>
  <path d="M8 14l4 5 4-5H8z"/>
`),

  'aspect-lock': strokeSvg(`
  <rect x="6" y="6" width="12" height="12" rx="1.5"/>
  <path d="M10 12h4M12 10v4"/>
  <path d="M9 9.5V8.5a3 3 0 0 1 6 0V9.5"/>
`),

  'aspect-unlock': strokeSvg(`
  <rect x="6" y="6" width="12" height="12" rx="1.5"/>
  <path d="M10 12h4"/>
  <path d="M9 9.5V8.5a3 3 0 0 1 5.2-1.5"/>
`),

  'rotate-90': strokeSvg(`
  <rect x="7" y="9" width="8" height="8" rx="1"/>
  <path d="M15 7a6 6 0 0 0-8 0"/>
  <path d="M7 7h3v3"/>
  <path d="M17 11v2h2" opacity="0.5"/>
`),

  'resize-edge': strokeSvg(`
  <rect x="5" y="7" width="14" height="10" rx="1"/>
  <path d="M12 4v3M12 17v3"/>
  <path d="M10 5.5l2-2 2 2"/>
  <path d="M10 18.5l2 2 2-2"/>
`),

  // --- Appearance / color ---
  swatch: mixedSvg(`
  <rect x="4" y="4" width="7" height="7" rx="1" fill="currentColor"/>
  <rect x="13" y="4" width="7" height="7" rx="1" fill="currentColor" opacity="0.55"/>
  <rect x="4" y="13" width="7" height="7" rx="1" fill="currentColor" opacity="0.3"/>
  <rect x="13" y="13" width="7" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.75"/>
`),

  'pattern-fill': strokeSvg(`
  <rect x="4" y="4" width="16" height="16" rx="1.5"/>
  <path d="M4 12h16M12 4v16M7 7l10 10M17 7L7 17" opacity="0.55"/>
`),

  'blend-mode': mixedSvg(`
  <circle cx="9.5" cy="12" r="5.5" fill="currentColor" opacity="0.35"/>
  <circle cx="14.5" cy="12" r="5.5" fill="currentColor" opacity="0.55"/>
  <circle cx="9.5" cy="12" r="5.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <circle cx="14.5" cy="12" r="5.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
`),

  'effect-shadow': mixedSvg(`
  <rect x="8" y="8" width="11" height="11" rx="1.5" fill="currentColor" opacity="0.3"/>
  <rect x="5" y="5" width="11" height="11" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.75"/>
`),

  'effect-blur': strokeSvg(`
  <circle cx="12" cy="12" r="3"/>
  <circle cx="12" cy="12" r="6" opacity="0.45"/>
  <circle cx="12" cy="12" r="9" opacity="0.25"/>
`),

  'graphic-style': strokeSvg(`
  <rect x="5" y="4" width="14" height="16" rx="1.5"/>
  <path d="M8 8h8M8 12h8M8 16h5"/>
`),

  // --- Type extras ---
  underline: strokeSvg(`
  <path d="M7 6v6a5 5 0 0 0 10 0V6"/>
  <path d="M6 19h12"/>
`),

  'align-text-left': strokeSvg(`
  <path d="M5 7h14M5 12h10M5 17h12"/>
`),

  'align-text-center': strokeSvg(`
  <path d="M5 7h14M7 12h10M6 17h12"/>
`),

  'align-text-right': strokeSvg(`
  <path d="M5 7h14M9 12h10M7 17h12"/>
`),

  'convert-outlines': strokeSvg(`
  <path d="M7 6h8l2 3v9H7V6z"/>
  <path d="M10 10h4M12 10v6"/>
`),

  font: strokeSvg(`
  <path d="M6 18L10 6h4l4 12"/>
  <path d="M8.5 13h7"/>
`),

  // --- Layers / document ---
  'layer-folder': strokeSvg(`
  <path d="M4 8V6a1 1 0 0 1 1-1h5l2 2h7a1 1 0 0 1 1 1v1"/>
  <path d="M4 9h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9z"/>
`),

  isolation: strokeSvg(`
  <rect x="4" y="4" width="16" height="16" rx="1.5" opacity="0.3"/>
  <rect x="8" y="8" width="8" height="8" rx="1"/>
`),

  symbol: strokeSvg(`
  <rect x="5" y="5" width="14" height="14" rx="2"/>
  <circle cx="12" cy="12" r="3.5"/>
  <path d="M12 8.5v7M8.5 12h7"/>
`),

  artboards: strokeSvg(`
  <rect x="3.5" y="5" width="9" height="11" rx="1"/>
  <rect x="11.5" y="8" width="9" height="11" rx="1"/>
`),

  'outline-mode': strokeSvg(`
  <path d="M5 8l7-4 7 4v8l-7 4-7-4V8z"/>
  <path d="M5 8l7 4 7-4M12 12v8"/>
`),

  'pixel-preview': strokeSvg(`
  <rect x="4" y="4" width="16" height="16" rx="1"/>
  <path d="M4 12h16M12 4v16M8 4v16M16 4v16M4 8h16M4 16h16" opacity="0.45"/>
`),

  rulers: strokeSvg(`
  <path d="M4 4h16v4H4z"/>
  <path d="M4 4v16h4V4"/>
  <path d="M7 6v2M10 6v2M13 6v2M16 6v2M6 7h2M6 10h2M6 13h2M6 16h2"/>
`),

  'place-image': strokeSvg(`
  <rect x="4" y="5" width="16" height="14" rx="1.5"/>
  <circle cx="9" cy="10" r="1.5"/>
  <path d="M5 16l4-3 3 2 3-3 4 4"/>
`),

  copy: strokeSvg(`
  <rect x="8" y="8" width="11" height="12" rx="1.5"/>
  <path d="M16 8V6.5A1.5 1.5 0 0 0 14.5 5H6.5A1.5 1.5 0 0 0 5 6.5v10A1.5 1.5 0 0 0 6.5 18H8"/>
`),

  paste: strokeSvg(`
  <path d="M9 5h6v2H9z"/>
  <rect x="6" y="6" width="12" height="14" rx="1.5"/>
  <path d="M9 11h6M9 14h6M9 17h4"/>
`),

  cut: strokeSvg(`
  <circle cx="7" cy="7" r="2.25"/>
  <circle cx="7" cy="17" r="2.25"/>
  <path d="M9 8.5L18 5"/>
  <path d="M9 15.5L18 19"/>
`),

  'export-pdf': strokeSvg(`
  <path d="M7 3h7l4 4v14H7V3z"/>
  <path d="M14 3v4h4"/>
  <path d="M9 13h2.5a1.5 1.5 0 0 1 0 3H9v-3zM9 16v3"/>
`),

  'nest-layers': strokeSvg(`
  <path d="M5 6h14"/>
  <path d="M8 10h11"/>
  <path d="M11 14h8"/>
  <path d="M5 6v12"/>
  <path d="M5 10h3M5 14h6"/>
`),
}

const EXPECTED = [
  'open',
  'save',
  'export-svg',
  'export-png',
  'undo',
  'redo',
  'group',
  'ungroup',
  'align-left',
  'align-h-center',
  'align-right',
  'align-top',
  'align-v-center',
  'align-bottom',
  'dist-h',
  'dist-v',
  'check',
  'cancel',
  'snap',
  'guides',
  'visible',
  'hidden',
  'locked',
  'unlocked',
  'up',
  'down',
  'delete',
  'paint-none',
  'paint-solid',
  'paint-linear',
  'paint-radial',
  'stroke-center',
  'stroke-inside',
  'stroke-outside',
  'angle-h',
  'angle-v',
  'angle-diag',
  'tool-select',
  'tool-pen',
  'tool-text',
  'tool-line',
  'tool-rect',
  'tool-ellipse',
  'tool-direct',
  'tool-rounded-rect',
  'tool-polygon',
  'tool-star',
  'pathfinder-unite',
  'pathfinder-subtract',
  'pathfinder-intersect',
  'pathfinder-exclude',
  'cap-butt',
  'cap-round',
  'cap-square',
  'join-miter',
  'join-round',
  'join-bevel',
  'dash',
  'arrow-end',
  'bring-front',
  'send-back',
  'align-artboard',
  'duplicate',
  'import-svg',
  'bold',
  'italic',
  'add-anchor',
  'delete-anchor',
  'convert-anchor',
  // Wave 2+
  'tool-pencil',
  'tool-eyedropper',
  'tool-lasso',
  'tool-curvature',
  'tool-paintbrush',
  'tool-smooth',
  'tool-path-eraser',
  'tool-scissors',
  'tool-knife',
  'tool-join',
  'tool-arc',
  'tool-shape-builder',
  'tool-hand',
  'tool-zoom',
  'tool-gradient',
  'tool-artboard',
  'tool-rotate',
  'tool-scale',
  'tool-reflect',
  'tool-shear',
  'tool-free-transform',
  'tool-area-text',
  'tool-type-path',
  'pathfinder-divide',
  'pathfinder-trim',
  'pathfinder-merge',
  'pathfinder-crop',
  'pathfinder-outline',
  'outline-stroke',
  'offset-path',
  'compound-path',
  'clip-mask',
  'opacity-mask',
  'reflect-h',
  'reflect-v',
  'flip-h',
  'flip-v',
  'aspect-lock',
  'aspect-unlock',
  'rotate-90',
  'resize-edge',
  'swatch',
  'pattern-fill',
  'blend-mode',
  'effect-shadow',
  'effect-blur',
  'graphic-style',
  'underline',
  'align-text-left',
  'align-text-center',
  'align-text-right',
  'convert-outlines',
  'font',
  'layer-folder',
  'isolation',
  'symbol',
  'artboards',
  'outline-mode',
  'pixel-preview',
  'rulers',
  'place-image',
  'copy',
  'paste',
  'cut',
  'export-pdf',
  'nest-layers',
]

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const missing = EXPECTED.filter((n) => !ICONS[n])
  if (missing.length) {
    console.error('Missing icon definitions:', missing.join(', '))
    process.exit(1)
  }

  const extra = Object.keys(ICONS).filter((n) => !EXPECTED.includes(n))
  if (extra.length) {
    console.error('Unexpected extra icons:', extra.join(', '))
    process.exit(1)
  }

  let written = 0
  for (const name of EXPECTED) {
    const file = path.join(OUT_DIR, `${name}.svg`)
    // Normalize indentation / blank lines inside SVG content
    const svg = ICONS[name].replace(/\n[ \t]+\n/g, '\n').trim() + '\n'
    fs.writeFileSync(file, svg, 'utf8')
    written++
  }

  console.log(`Wrote ${written} icons to ${OUT_DIR}`)
}

main()
