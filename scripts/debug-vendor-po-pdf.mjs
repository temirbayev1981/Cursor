#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'

const pdfPath = process.argv[2]
if (!pdfPath) {
  console.error('Usage: node scripts/debug-vendor-po-pdf.mjs <file.pdf>')
  process.exit(1)
}

pdfjsLib.GlobalWorkerOptions.workerSrc = path.resolve('node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')
const data = new Uint8Array(fs.readFileSync(pdfPath))
const pdf = await pdfjsLib.getDocument({ data, useSystemFonts: true }).promise

let all = ''
for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i)
  const content = await page.getTextContent()
  all += content.items.map((item) => ('str' in item ? item.str : '')).join(' ') + '\n\n'
}
const text = all.trim()
console.log('TEXT_LENGTH', text.length)
console.log('HAS_VENDOR_PO', /VENDOR\s*PO\s*#/i.test(text))
console.log('HAS_CLIENT_PO', /Client PO #/i.test(text))
console.log('HAS_SERVICE_DESC', /SERVICE DESCRIPTION/i.test(text))
console.log('HAS_SPECIAL', /SPECIAL INSTRUCTIONS/i.test(text))
console.log('PO_NUMBER_MATCHES', [...text.matchAll(/\d{6}-\d{2}/g)].map((m) => m[0]))
