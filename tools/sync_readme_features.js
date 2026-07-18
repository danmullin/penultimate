#!/usr/bin/env node
/**
 * Sync README.md "Features & shortcuts" from src/data/features.json
 * Usage: npm run sync:readme
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const readmePath = path.join(root, 'README.md')
const catalog = JSON.parse(
  fs.readFileSync(path.join(root, 'src/data/features.json'), 'utf8'),
)

function cell(text) {
  return String(text ?? '').replace(/\|/g, '\\|')
}

function sectionMarkdown(section) {
  const hasShortcut = section.items.some((i) => i.shortcut)
  const lines = [`### ${section.title}`, '']
  if (hasShortcut) {
    lines.push('| Feature | Shortcut / notes |', '|---------|------------------|')
    for (const item of section.items) {
      const right = [item.shortcut, item.note].filter(Boolean).join(' — ')
      lines.push(`| ${cell(item.name)} | ${cell(right || '—')} |`)
    }
  } else {
    lines.push('| Feature | Notes |', '|---------|-------|')
    for (const item of section.items) {
      lines.push(`| ${cell(item.name)} | ${cell(item.note || '—')} |`)
    }
  }
  lines.push('')
  return lines.join('\n')
}

const featuresBody = [
  '`Ctrl` is `Cmd` on macOS.',
  '',
  ...catalog.map(sectionMarkdown),
  'In the app, open the same list from the **?** button in the menu bar (source: `src/data/features.json`).',
  '',
].join('\n')

const readme = fs.readFileSync(readmePath, 'utf8')
const start = readme.indexOf('## Features & shortcuts')
const end = readme.indexOf('## Project format')
if (start < 0 || end < 0 || end <= start) {
  console.error('Could not find Features / Project format markers in README.md')
  process.exit(1)
}

const next =
  readme.slice(0, start) +
  '## Features & shortcuts\n\n' +
  featuresBody +
  '\n' +
  readme.slice(end)

fs.writeFileSync(readmePath, next)
console.log('README features synced from src/data/features.json')
