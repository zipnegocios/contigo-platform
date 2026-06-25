import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../src/infrastructure/db/schema'

const client = postgres(process.env.DATABASE_URL!, { max: 1 })
const db = drizzle(client, { schema })

async function main() {
  const cats = await db.select().from(schema.categories)
  const svcs = await db.select().from(schema.services)

  const roots = cats.filter((c) => c.type === 'service' && !c.parentId)
  console.log('=== Service root categories ===')
  for (const r of roots.sort((a, b) => a.orderIndex - b.orderIndex)) {
    const kids = cats.filter((c) => c.parentId === r.id)
    const activeKids = kids.filter((c) => c.isActive)
    console.log(
      `${r.isActive ? 'ACTIVE  ' : 'inactive'} ${r.name} — children: ${kids.length} (${activeKids.length} active)`,
    )
  }

  const activeRootIds = new Set(roots.filter((r) => r.isActive).map((r) => r.id))
  const leavesNoIcon = cats.filter((c) => c.parentId && activeRootIds.has(c.parentId) && c.isActive && !c.icon)
  console.log('\nLeaf categories missing an icon:', leavesNoIcon.length === 0 ? 'none' : leavesNoIcon.map((c) => c.name))

  console.log('\n=== Services ===')
  console.log(`total=${svcs.length} published=${svcs.filter((s) => s.published).length}`)
  const orphanServices = svcs.filter((s) => !s.categoryId || !cats.some((c) => c.id === s.categoryId))
  console.log(`orphan services: ${orphanServices.length}`)

  const colCheck = await client`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'request_form_id'
  `
  console.log('\nrequest_form_id column present:', colCheck.length > 0)

  await client.end()
}

main()
