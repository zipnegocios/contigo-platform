import { DrizzleHeroConfigRepository } from '@/infrastructure/repositories/DrizzleHeroConfigRepository'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'
import { HeroConfigEditor } from '@/presentation/components/admin/hero/HeroConfigEditor'

export const metadata = { title: 'Hero Section — Contigo Admin' }

export default async function HeroPage() {
  const [config, services, projects] = await Promise.all([
    new DrizzleHeroConfigRepository().get(),
    new DrizzleServiceRepository().findAll(),
    new DrizzleProjectRepository().findAll(),
  ])

  const serviceOptions = services.map((s) => ({ id: s.id, label: s.name, slug: s.slug }))
  const projectOptions = projects.map((p) => ({ id: p.id, label: p.title, slug: p.slug }))

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontSize: '1.875rem',
            fontWeight: 700,
            color: '#2D2924',
          }}
        >
          Hero Section
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#6B6560', marginTop: '0.25rem' }}>
          Control the homepage hero: images, text, and call-to-action buttons.
        </p>
      </header>
      <HeroConfigEditor
        initialConfig={config}
        serviceOptions={serviceOptions}
        projectOptions={projectOptions}
      />
    </div>
  )
}
