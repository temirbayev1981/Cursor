#!/usr/bin/env node
/**
 * Generates minimal text-layer PDF fixtures for vendor PO E2E tests.
 * Usage: node scripts/generate-vendor-po-fixture.mjs <output.pdf> "<line1>" "<line2>" ...
 */
import { writeFileSync } from 'node:fs'

function escapePdfText(value) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function buildPdf(lines) {
  const fontSize = 10
  const startY = 750
  const lineHeight = 12
  const ops = lines
    .map((line, index) => {
      const y = startY - index * lineHeight
      return `1 0 0 1 50 ${y} Tm (${escapePdfText(line)}) Tj`
    })
    .join('\n')
  const stream = `BT\n/F1 ${fontSize} Tf\n${ops}\nET`
  const streamLen = Buffer.byteLength(stream, 'utf8')

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${streamLen} >>\nstream\n${stream}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'))
    pdf += obj
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8')
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`
  pdf += `startxref\n${xrefOffset}\n%%EOF\n`
  return pdf
}

const [outputPath, ...lines] = process.argv.slice(2)
if (!outputPath || lines.length === 0) {
  console.error('Usage: node scripts/generate-vendor-po-fixture.mjs <output.pdf> "line1" "line2" ...')
  process.exit(1)
}

writeFileSync(outputPath, buildPdf(lines))
console.log(`Wrote ${outputPath} (${lines.length} lines)`)
