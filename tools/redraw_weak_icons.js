#!/usr/bin/env node
/**
 * Second-pass redraw for weak icons (mask-friendly: stroke only, no opacity/gradients).
 * Usage: node tools/redraw_weak_icons.js
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '..', 'public', 'icons')

function svg(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
${inner}
</svg>
`
}

/** @type {Record<string, string>} */
const icons = {
  // —— Used in UI ——
  // Hollow-outline pointer (vs filled tool-select)
  'tool-direct': `
  <path d="M6 3.75 L6 17.75 L10.25 13.75 L13.5 20.75 L16.25 19.25 L13 12.25 H19.75 Z"/>
`,

  'aspect-lock': `
  <rect x="5" y="5" width="14" height="14" rx="1.5"/>
  <path d="M9.5 12h5"/>
  <path d="M12 9.5v5"/>
  <path d="M9.75 9.25c0-1.4 1-2.35 2.25-2.35S14.25 7.85 14.25 9.25"/>
`,

  'aspect-unlock': `
  <rect x="5" y="5" width="14" height="14" rx="1.5"/>
  <path d="M9.5 12h2"/>
  <path d="M14 12h1.5"/>
  <path d="M12 10.5v3.5"/>
  <path d="M9.75 9.25c0-1.4 1-2.35 2.25-2.35"/>
  <path d="M14 7.4c.8.35 1.25 1.1 1.25 1.85"/>
`,

  'outline-stroke': `
  <rect x="7.5" y="7.5" width="9" height="9" rx="1"/>
  <rect x="4.5" y="4.5" width="15" height="15" rx="1.5"/>
`,

  'clip-mask': `
  <rect x="4" y="5.5" width="11" height="11" rx="1"/>
  <circle cx="15" cy="13" r="5.5"/>
`,

  'reflect-h': `
  <path d="M12 4v16"/>
  <path d="M10 8 L5 12 L10 16"/>
  <path d="M14 8 L19 12 L14 16"/>
`,

  'reflect-v': `
  <path d="M4 12h16"/>
  <path d="M8 10 L12 5 L16 10"/>
  <path d="M8 14 L12 19 L16 14"/>
`,

  'tool-shear': `
  <path d="M6 18 L10.5 5 H17 L12.5 18 Z"/>
  <path d="M4 20.25h16"/>
`,

  rulers: `
  <path d="M5 5h14v3.25H8.25V19H5V5z"/>
  <path d="M8.25 9.5h2.25M8.25 12h3.25M8.25 14.5h2.25M8.25 17h3.25"/>
  <path d="M11 5v2M14 5v2.75M17 5v2"/>
`,

  // —— Unused / future tools ——
  'tool-hand': `
  <path d="M8 11.5V8.25a1.4 1.4 0 0 1 2.8 0V11"/>
  <path d="M10.8 10.75V7.5a1.4 1.4 0 0 1 2.8 0V11"/>
  <path d="M13.6 10.75V8.5a1.4 1.4 0 0 1 2.8 0V13.5c0 2.6-1.7 4.5-4.4 4.5h-.7c-2.6 0-4.3-1.9-4.3-4.5v-2.2a1.4 1.4 0 0 1 2.8 0"/>
`,

  'tool-paintbrush': `
  <path d="M12.5 19c-2.3 0-3.75-1.25-3.75-3 0-1.35.85-2.3 2.15-3.25L15 9.5"/>
  <path d="M15.25 9.25 L18.75 5.75c.85-.85 2.25-.85 3.1 0s.85 2.25 0 3.1L18.35 12.3"/>
  <path d="M9.5 16.75c-.15 1.6-1.15 2.85-3 3.1"/>
`,

  'tool-knife': `
  <path d="M5.5 19 L14.25 6.75 L17.5 9.5 L9.25 20.25 Z"/>
  <path d="M14.25 6.75 L16.25 4.5 L19.75 8 L17.5 9.5"/>
`,

  'tool-lasso': `
  <path d="M7.5 14.5c-2-.9-3.25-2.85-3.25-5.05C4.25 6 7.5 3.5 11.6 3.5s7.35 2.5 7.35 5.95c0 2.4-1.45 4.35-3.6 5.25"/>
  <path d="M12 14.75v5.75"/>
  <path d="M10 18.75h4"/>
`,

  'tool-smooth': `
  <path d="M4 16.5c3-8 5.25-10.25 8-10.25S17 8.5 20 16.5"/>
  <path d="M8 14c1.6-3.1 2.7-4.1 4-4.1s2.4 1 4 4.1"/>
`,

  'tool-path-eraser': `
  <path d="M4 16c2.6-2 5.2-3 8-3s5.4 1 8 3"/>
  <path d="M14 6.75 L18.75 11.5 L12.25 18 H8.5 L14 6.75z"/>
  <path d="M15.5 8.35 L17.65 10.5"/>
`,

  'tool-gradient': `
  <rect x="5" y="5" width="14" height="14" rx="1.5"/>
  <path d="M5 12h14"/>
  <path d="M9 5v14M15 5v14"/>
`,

  'opacity-mask': `
  <circle cx="9.75" cy="12" r="5.75"/>
  <circle cx="14.25" cy="12" r="5.75"/>
`,

  'tool-type-path': `
  <path d="M4 16.5c3.25-6.25 6.5-8.25 10.25-8.25 2.6 0 4.6 1.35 5.75 3.5"/>
  <path d="M10.5 4.75v7"/>
  <path d="M8 4.75h5"/>
`,

  'tool-shape-builder': `
  <rect x="4" y="4" width="10" height="10" rx="1"/>
  <rect x="10" y="10" width="10" height="10" rx="1"/>
  <path d="M17.5 6.5v4M15.5 8.5h4"/>
`,

  'convert-outlines': `
  <path d="M6 4h8v16H6z"/>
  <path d="M8.5 7h5M11 7v10M8.5 17h5"/>
  <path d="M16.25 9.25 L19.5 12.25 L16.25 15.25"/>
`,

  'graphic-style': `
  <rect x="5" y="4" width="14" height="16" rx="1.5"/>
  <path d="M8 8.5h8M8 12h8M8 15.5h4.5"/>
  <circle cx="16.25" cy="15.5" r="2"/>
`,

  symbol: `
  <path d="M12 3.5 L19 7.5 V16.5 L12 20.5 L5 16.5 V7.5 Z"/>
  <circle cx="12" cy="12" r="2.25"/>
`,

  'pathfinder-outline': `
  <rect x="4.5" y="4.5" width="10" height="10" rx="1"/>
  <path d="M10 10h9.5v9.5H10z"/>
`,

  'pathfinder-merge': `
  <path d="M7 8.25h5.5a3.75 3.75 0 0 1 0 7.5H7"/>
  <path d="M11.5 8.25H17a3.75 3.75 0 0 1 0 7.5h-5.5"/>
`,

  'export-pdf': `
  <path d="M7 3h7l4 4v14H7V3z"/>
  <path d="M14 3v4h4"/>
  <path d="M9 14h2a1.5 1.5 0 0 0 0-3H9v6"/>
  <path d="M13.75 17v-5h.15c1.2 0 1.95.7 1.95 1.8S15.1 15.5 13.9 15.5h-.15"/>
`,

  'convert-anchor': `
  <rect x="9.75" y="9.75" width="4.5" height="4.5"/>
  <path d="M12 4.5v5.25M12 14.25v5.25M4.5 12h5.25M14.25 12h5.25"/>
  <path d="M7.75 7.75 L5.75 5.75M16.25 7.75 L18.25 5.75M7.75 16.25 L5.75 18.25M16.25 16.25 L18.25 18.25"/>
`,

  'pattern-fill': `
  <rect x="4.5" y="4.5" width="15" height="15" rx="1.5"/>
  <circle cx="9" cy="9" r="1.2"/>
  <circle cx="15" cy="9" r="1.2"/>
  <circle cx="9" cy="15" r="1.2"/>
  <circle cx="15" cy="15" r="1.2"/>
`,

  'rotate-90': `
  <rect x="8.5" y="8.5" width="8.5" height="8.5" rx="1"/>
  <path d="M7 14.5c0-4.4 3.1-7.5 7.5-7.5"/>
  <path d="M12.25 4.75 L14.75 6.75 L12.25 8.75"/>
`,

  isolation: `
  <rect x="4" y="4" width="16" height="16" rx="1.5"/>
  <rect x="8.25" y="8.25" width="7.5" height="7.5" rx="1"/>
  <path d="M4.75 4.75 L8 8M19.25 4.75 L16 8M4.75 19.25 L8 16M19.25 19.25 L16 16"/>
`,
}

let n = 0
for (const [name, inner] of Object.entries(icons)) {
  fs.writeFileSync(path.join(OUT, `${name}.svg`), svg(inner.trim() + '\n'))
  n++
  console.log('wrote', name)
}
console.log('done', n)
