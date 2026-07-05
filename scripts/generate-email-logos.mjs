import { readFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const targets = [
  {
    src: path.join(root, 'public/assets/logos/logo-family_main-logo.svg'),
    out: path.join(root, 'public/assets/logos/email/logo-main-gold.png'),
    color: '#D4AF37',
    width: 400,
    height: 360,
  },
  {
    src: path.join(root, 'public/assets/logos/logo-family_icon-logo.svg'),
    out: path.join(root, 'public/assets/logos/email/logo-icon-white.png'),
    color: '#FFFFFF',
    width: 280,
    height: 194,
  },
]

mkdirSync(path.join(root, 'public/assets/logos/email'), { recursive: true })

for (const target of targets) {
  const svg = readFileSync(target.src, 'utf-8').replaceAll('fill="currentColor"', `fill="${target.color}"`)
  await sharp(Buffer.from(svg), { density: 300 })
    .resize(target.width, target.height)
    .png()
    .toFile(target.out)
  console.log(`Wrote ${target.out}`)
}
