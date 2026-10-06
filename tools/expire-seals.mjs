#!/usr/bin/env node
// Strip sealed URLs whose data-expires has passed, so the live page stops carrying them.
// Usage (from the site root):  node tools/expire-seals.mjs [page.html ...]
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'

const pages = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync('.').filter((f) => f.endsWith('.html'))
const now = Date.now()
let stripped = 0
for (const page of pages) {
  const html = readFileSync(page, 'utf8')
  const out = html.replace(/<button\b[^>]*\bdata-expires="([^"]+)"[^>]*>/g, (tag, when) => {
    if (!/data-sealed="/.test(tag) || now < Date.parse(when)) return tag
    stripped++
    return tag.replace(/\s*data-sealed="[^"]*"/, '').replace(/\s*hidden(?=[\s>])/, '').replace(/>$/, ' hidden>')
  })
  if (out !== html) writeFileSync(page, out)
}
console.log(`stripped ${stripped} expired seal(s)`)
