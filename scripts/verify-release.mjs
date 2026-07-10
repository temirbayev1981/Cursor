#!/usr/bin/env node
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

console.log(`HandymanOS AI v${pkg.version} — release verification\n`)

const steps = [
  ['Lint', 'npm run lint'],
  ['Unit tests', 'npm test'],
  ['Production build', 'npm run build'],
]

for (const [label, command] of steps) {
  console.log(`→ ${label}`)
  execSync(command, { stdio: 'inherit' })
}

console.log('\n✓ Release verification passed')
