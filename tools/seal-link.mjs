#!/usr/bin/env node
// Seal a private URL into a page so only passphrase holders can open it.
// Usage (from the site root):  node tools/seal-link.mjs <page.html> <seal-id>
import { readFileSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'

const [page, id] = process.argv.slice(2)
if (!page || !id) { console.error('usage: node tools/seal-link.mjs <page.html> <seal-id>'); process.exit(2) }

const ask = (q, hide) => new Promise((done) => {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
  if (hide) rl._writeToOutput = (s) => { if (s.startsWith(q)) process.stdout.write(q) }
  rl.question(q, (a) => { rl.close(); if (hide) process.stdout.write('\n'); done(a.trim()) })
})

const url = await ask('URL to seal: ')
const pass = await ask('Passphrase: ', true)
if (pass !== await ask('Repeat passphrase: ', true)) { console.error('passphrases differ'); process.exit(1) }
if (!/^https:\/\//.test(url) || pass.length < 12) { console.error('need an https URL and a passphrase of 12+ characters'); process.exit(1) }

const { subtle } = globalThis.crypto
const salt = crypto.getRandomValues(new Uint8Array(16))
const iv = crypto.getRandomValues(new Uint8Array(12))
const base = await subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey'])
const key = await subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
  base, { name: 'AES-GCM', length: 256 }, false, ['encrypt'])
const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(url)))
const blob = Buffer.concat([salt, iv, ct]).toString('base64url')

const html = readFileSync(page, 'utf8')
const tag = new RegExp(`<button([^>]*?)data-seal-id="${id}"([^>]*)>`)
if (!tag.test(html)) { console.error(`no <button data-seal-id="${id}"> in ${page}`); process.exit(1) }
const out = html.replace(tag, (_, a, b) =>
  `<button${a}data-seal-id="${id}"${b.replace(/\s*data-sealed="[^"]*"/, '').replace(/\s*hidden/, '')} data-sealed="${blob}">`)
writeFileSync(page, out)
console.log(`sealed ${id} in ${page}`)
