#!/usr/bin/env node
/**
 * Generate Illustrator-style mouse cursors into public/cursors/
 * Black glyphs + white halo so they read on light and dark artboards.
 * Usage: node tools/gen_cursors.js
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '..', 'public', 'cursors')

/** @type {Record<string, { hotspot: [number, number]; svg: string; fallback: string }>} */
const CURSORS = {
  select: {
    hotspot: [5, 2],
    fallback: 'default',
    svg: `
      <path d="M5 2 L5 26 L11.5 20.5 L16.5 30 L20 28 L15 18.5 L24 18.5 Z"
        fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>
    `,
  },
  direct: {
    hotspot: [5, 2],
    fallback: 'default',
    svg: `
      <path d="M5 2 L5 26 L11.5 20.5 L16.5 30 L20 28 L15 18.5 L24 18.5 Z"
        fill="#fff" stroke="#111" stroke-width="1.75" stroke-linejoin="round"/>
    `,
  },
  pen: {
    hotspot: [4, 28],
    fallback: 'crosshair',
    svg: `
      <path d="M6 28 L10 18 L22 6 L26 10 L14 22 Z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M20 8 L24 12" stroke="#fff" stroke-width="1.25"/>
      <path d="M8 26 L6 28 L8 26" fill="#111"/>
    `,
  },
  'pen-add': {
    hotspot: [4, 28],
    fallback: 'crosshair',
    svg: `
      <path d="M6 28 L10 18 L20 8 L24 12 L14 22 Z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="24" cy="8" r="6" fill="#fff" stroke="#111" stroke-width="1.25"/>
      <path d="M24 5v6M21 8h6" stroke="#111" stroke-width="1.5" stroke-linecap="round"/>
    `,
  },
  'pen-remove': {
    hotspot: [4, 28],
    fallback: 'crosshair',
    svg: `
      <path d="M6 28 L10 18 L20 8 L24 12 L14 22 Z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="24" cy="8" r="6" fill="#fff" stroke="#111" stroke-width="1.25"/>
      <path d="M21 8h6" stroke="#111" stroke-width="1.5" stroke-linecap="round"/>
    `,
  },
  'pen-close': {
    hotspot: [4, 28],
    fallback: 'crosshair',
    svg: `
      <path d="M6 28 L10 18 L20 8 L24 12 L14 22 Z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="24" cy="8" r="6" fill="#fff" stroke="#111" stroke-width="1.25"/>
      <circle cx="24" cy="8" r="2.25" fill="none" stroke="#111" stroke-width="1.5"/>
    `,
  },
  pencil: {
    hotspot: [4, 28],
    fallback: 'crosshair',
    svg: `
      <path d="M5 28 L9 16 L23 4 L28 9 L14 23 Z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M20 7 L25 12" stroke="#fff" stroke-width="1.25"/>
      <path d="M5 28 L8 25" stroke="#fff" stroke-width="1"/>
    `,
  },
  eyedropper: {
    hotspot: [5, 28],
    fallback: 'crosshair',
    svg: `
      <path d="M18 4 L28 14" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
      <path d="M18 4 L28 14" stroke="#111" stroke-width="2" stroke-linecap="round"/>
      <path d="M16 8 L6 22 L4 28 L10 26 L24 12 Z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M8 20 L12 24" stroke="#fff" stroke-width="1.25"/>
    `,
  },
  text: {
    hotspot: [16, 16],
    fallback: 'text',
    svg: `
      <path d="M10 6h12M16 6v20M12 26h8" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
      <path d="M10 6h12M16 6v20M12 26h8" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round"/>
    `,
  },
  line: {
    hotspot: [16, 16],
    fallback: 'crosshair',
    svg: crosshairBadge(`
      <path d="M10 22 L22 10" stroke="#111" stroke-width="1.75" stroke-linecap="round"/>
      <circle cx="10" cy="22" r="1.5" fill="#111"/>
      <circle cx="22" cy="10" r="1.5" fill="#111"/>
    `),
  },
  rect: {
    hotspot: [16, 16],
    fallback: 'crosshair',
    svg: crosshairBadge(`
      <rect x="10" y="10" width="12" height="12" fill="none" stroke="#111" stroke-width="1.75"/>
    `),
  },
  'rounded-rect': {
    hotspot: [16, 16],
    fallback: 'crosshair',
    svg: crosshairBadge(`
      <rect x="10" y="10" width="12" height="12" rx="3" fill="none" stroke="#111" stroke-width="1.75"/>
    `),
  },
  ellipse: {
    hotspot: [16, 16],
    fallback: 'crosshair',
    svg: crosshairBadge(`
      <ellipse cx="16" cy="16" rx="7" ry="5.5" fill="none" stroke="#111" stroke-width="1.75"/>
    `),
  },
  polygon: {
    hotspot: [16, 16],
    fallback: 'crosshair',
    svg: crosshairBadge(`
      <path d="M16 9 L22 13.5 L19.5 20.5 H12.5 L10 13.5 Z" fill="none" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/>
    `),
  },
  star: {
    hotspot: [16, 16],
    fallback: 'crosshair',
    svg: crosshairBadge(`
      <path d="M16 8.5l1.6 4.2h4.4l-3.5 2.6 1.3 4.2L16 17.2l-3.8 2.3 1.3-4.2-3.5-2.6h4.4z" fill="none" stroke="#111" stroke-width="1.35" stroke-linejoin="round"/>
    `),
  },
  move: {
    hotspot: [16, 16],
    fallback: 'move',
    svg: `
      <path d="M16 4v24M4 16h24" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
      <path d="M16 4v24M4 16h24" stroke="#111" stroke-width="2" stroke-linecap="round"/>
      <path d="M16 4l-3 4h6zM16 28l-3-4h6zM4 16l4-3v6zM28 16l-4-3v6z" fill="#111" stroke="#fff" stroke-width="1"/>
    `,
  },
  precision: {
    hotspot: [16, 16],
    fallback: 'crosshair',
    svg: `
      <path d="M16 2v10M16 20v10M2 16h10M20 16h10" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M16 2v10M16 20v10M2 16h10M20 16h10" stroke="#111" stroke-width="1.75" stroke-linecap="round"/>
      <circle cx="16" cy="16" r="1.5" fill="#111" stroke="#fff" stroke-width="1"/>
    `,
  },
}

function crosshairBadge(inner) {
  return `
    <path d="M16 4v6M16 22v6M4 16h6M22 16h6" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M16 4v6M16 22v6M4 16h6M22 16h6" stroke="#111" stroke-width="1.75" stroke-linecap="round"/>
    <g transform="translate(0 0)">${inner}</g>
  `
}

function wrap(inner) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
${inner}
</svg>
`
}

/** Hotspot map written for the app to import. */
function main() {
  fs.mkdirSync(OUT, { recursive: true })
  /** @type {Record<string, { x: number; y: number; fallback: string }>} */
  const meta = {}
  for (const [name, def] of Object.entries(CURSORS)) {
    const file = path.join(OUT, `${name}.svg`)
    fs.writeFileSync(file, wrap(def.svg.trim()) + '\n', 'utf8')
    meta[name] = { x: def.hotspot[0], y: def.hotspot[1], fallback: def.fallback }
    console.log('wrote', name)
  }
  fs.writeFileSync(
    path.join(OUT, 'hotspots.json'),
    JSON.stringify(meta, null, 2) + '\n',
    'utf8',
  )
  console.log(`Wrote ${Object.keys(CURSORS).length} cursors + hotspots.json`)
}

main()
