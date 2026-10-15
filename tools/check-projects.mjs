#!/usr/bin/env node
// The banner's Projects panel mirrors the list on projects.html; fail if the two drift.
import { readFileSync } from 'node:fs'

const norm = (s) => s.replace(/\s+/g, ' ').replace(/> </g, '><').trim()
const page = readFileSync('projects.html', 'utf8').match(/<ul class="strips">[\s\S]*?<\/ul>/)
const script = readFileSync('assets/nav-panel.js', 'utf8').match(/const LIST = `([\s\S]*?)`/)
if (!page || !script || norm(page[0]) !== norm(script[1])) {
  console.error('assets/nav-panel.js LIST has drifted from the list in projects.html')
  process.exit(1)
}
console.log('projects panel in sync')
