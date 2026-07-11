#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'

const pdfPath = process.argv[2]
if (!pdfPath) {
  console.error('Usage: node scripts/parse-vendor-po-sample.mjs <file.pdf>')
  process.exit(1)
}

pdfjsLib.GlobalWorkerOptions.workerSrc = path.resolve('node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')
const data = new Uint8Array(fs.readFileSync(pdfPath))
const pdf = await pdfjsLib.getDocument({ data, useSystemFonts: true, disableWorker: true }).promise

let all = ''
for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i)
  const content = await page.getTextContent()
  all += content.items.map((item) => ('str' in item ? item.str : '')).join(' ')
  if (i === 1) break
}

const { parseVendorPOText, normalizeVendorPOText } = await import('../src/lib/vendor-po-parser.ts')
const norm = normalizeVendorPOText(all)
const idx = norm.indexOf('SERVICE LOCATION')
console.log('NORMALIZED:', norm.slice(idx, idx + 500))
const r = parseVendorPOText(all, path.basename(pdfPath), 'comp-001')
console.log(JSON.stringify({
  service_location_name: r.service_location_name,
  location_number: r.location_number,
  service_address: r.service_address,
  service_city: r.service_city,
  service_state: r.service_state,
  service_zip: r.service_zip,
}, null, 2))
