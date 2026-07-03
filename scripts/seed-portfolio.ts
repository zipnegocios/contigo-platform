/**
 * Seeds the portfolio with 5 example projects + 6 categories.
 * Uploads cover images from public/assets/ to R2, then inserts DB records.
 *
 * Usage: npx tsx scripts/seed-portfolio.ts
 */
import 'dotenv/config'
import { readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import * as schema from '../src/infrastructure/db/schema'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ── DB ────────────────────────────────────────────────────────────────────────
const client = postgres(process.env.DATABASE_URL!, { max: 1 })
const db = drizzle(client, { schema })

// ── R2 ────────────────────────────────────────────────────────────────────────
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  requestChecksumCalculation: 'WHEN_REQUIRED' as const,
  responseChecksumValidation: 'WHEN_REQUIRED' as const,
})

const BUCKET = process.env.R2_ASSETS_BUCKET || 'contigo-assets'
const ASSETS_URL = process.env.NEXT_PUBLIC_ASSETS_URL || 'https://assets.contigoconstructions.com.au'

async function uploadImage(localPath: string, key: string): Promise<string> {
  const body = await readFile(localPath)
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: 'image/jpeg',
    }),
  )
  return `${ASSETS_URL}/${key}`
}

// ── Seed data ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'New Home', isSystem: false },
  { name: 'Extension', isSystem: false },
  { name: 'Renovation', isSystem: false },
  { name: 'Commercial', isSystem: false },
  { name: 'Restoration', isSystem: false },
  { name: 'Uncategorized', isSystem: true },
]

const PROJECTS = [
  {
    slug: 'seaton-residence',
    title: 'Seaton Residence',
    category: 'New Home',
    description:
      'A bespoke family home in the heart of Seaton, designed with a seamless connection between indoor and outdoor living. The build features raked ceilings, polished concrete floors, and a custom kitchen fitted with stone benchtops. Every detail was crafted to meet the highest standards of contemporary luxury.',
    location: 'Seaton SA 5023',
    completedDate: new Date('2023-09-15'),
    localImage: 'public/assets/project-seatons.jpg',
    imageKey: 'projects/cover/seaton-residence.jpg',
  },
  {
    slug: 'henley-beach-extension',
    title: 'Henley Beach Extension',
    category: 'Extension',
    description:
      'A thoughtfully designed rear extension that doubled the living space of this coastal home. The project incorporated double-glazed bifold doors opening onto a new alfresco area, a master suite addition, and a full structural renovation of the existing open-plan kitchen and dining space.',
    location: 'Henley Beach SA 5022',
    completedDate: new Date('2023-04-20'),
    localImage: 'public/assets/project-henley.jpg',
    imageKey: 'projects/cover/henley-beach-extension.jpg',
  },
  {
    slug: 'glenelg-renovation',
    title: 'Glenelg Renovation',
    category: 'Renovation',
    description:
      'A full internal transformation of a 1960s beachside cottage. Structural walls were removed to create an open-plan living space, while carefully retaining the home\'s character. The project included a new kitchen, two renovated bathrooms, hardwood flooring throughout, and a modern façade update.',
    location: 'Glenelg SA 5045',
    completedDate: new Date('2022-11-08'),
    localImage: 'public/assets/project-glenelg.jpg',
    imageKey: 'projects/cover/glenelg-renovation.jpg',
  },
  {
    slug: 'prospect-commercial',
    title: 'Prospect Commercial',
    category: 'Commercial',
    description:
      'A premium commercial fitout for a boutique professional services firm in Prospect. The project involved a full strip-out and rebuild of a heritage terrace, converting it into a modern, accessible office space with exposed brick, polished concrete, and custom joinery — all while preserving the building\'s 1920s character.',
    location: 'Prospect SA 5082',
    completedDate: new Date('2024-02-28'),
    localImage: 'public/assets/project-prospect.jpg',
    imageKey: 'projects/cover/prospect-commercial.jpg',
  },
  {
    slug: 'adelaide-heritage-restore',
    title: 'Adelaide Heritage Restore',
    category: 'Restoration',
    description:
      'A meticulous restoration of a Federation-era terrace home in Adelaide CBD, returning it to its original grandeur. Work included lime mortar repointing, period-accurate timber window replacement, ornate cornice repair, and a sensitive modern extension at the rear that complies with State Heritage requirements.',
    location: 'Adelaide CBD SA 5000',
    completedDate: new Date('2022-06-30'),
    localImage: 'public/assets/project-heritage.jpg',
    imageKey: 'projects/cover/adelaide-heritage-restore.jpg',
  },
]

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Seeding portfolio...\n')

  // 1. Categories
  console.log('📂 Seeding categories...')
  for (const cat of CATEGORIES) {
    const slug = cat.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    const existing = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.slug, slug))
      .limit(1)

    if (existing.length > 0) {
      console.log(`  ✓ "${cat.name}" already exists`)
      continue
    }

    await db.insert(schema.categories).values({
      id: crypto.randomUUID(),
      name: cat.name,
      slug,
      isSystem: cat.isSystem,
    })
    console.log(`  ✅ Created category: "${cat.name}"`)
  }

  // 2. Projects — upload images + insert rows
  console.log('\n📸 Uploading images & seeding projects...')
  for (const proj of PROJECTS) {
    const existing = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.slug, proj.slug))
      .limit(1)

    if (existing.length > 0) {
      console.log(`  ✓ "${proj.title}" already exists`)
      continue
    }

    // Upload cover image
    const localPath = join(ROOT, proj.localImage)
    let coverImageUrl: string
    try {
      coverImageUrl = await uploadImage(localPath, proj.imageKey)
      console.log(`  ✅ Uploaded: ${proj.imageKey}`)
    } catch (err) {
      console.error(`  ❌ Failed to upload ${proj.localImage}:`, err)
      continue
    }

    // Insert project
    await db.insert(schema.projects).values({
      id: crypto.randomUUID(),
      slug: proj.slug,
      title: proj.title,
      category: proj.category,
      description: proj.description,
      location: proj.location,
      completedDate: proj.completedDate,
      featured: true,
      status: 'active',
      coverImageUrl,
      galleryUrls: [],
    })
    console.log(`  ✅ Created project: "${proj.title}"`)
  }

  console.log('\n🎉 Portfolio seeded successfully!')
  await client.end()
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
