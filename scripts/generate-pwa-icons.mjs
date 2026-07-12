import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const svg = readFileSync(resolve(root, 'public/favicon.svg'))

async function writeIcon(size, name, padding = 0) {
  const out = resolve(root, 'public', name)
  if (padding > 0) {
    const inner = Math.round(size * (1 - padding * 2))
    const icon = await sharp(svg).resize(inner, inner).png().toBuffer()
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 10, g: 14, b: 23, alpha: 1 },
      },
    })
      .composite([{ input: icon, gravity: 'centre' }])
      .png()
      .toFile(out)
  } else {
    await sharp(svg).resize(size, size).png().toFile(out)
  }
}

await writeIcon(192, 'icon-192.png')
await writeIcon(512, 'icon-512.png')
await writeIcon(512, 'icon-maskable-512.png', 0.12)
console.log('PWA icons generated in public/')
