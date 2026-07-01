import type { FeaturesGridBlockData } from '@/types/pageBlocks'
import * as Icons from 'lucide-react'

interface FeaturesGridBlockProps { data: FeaturesGridBlockData }

export function FeaturesGridBlock({ data }: FeaturesGridBlockProps) {
  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {data.features.map((feature, idx) => {
          // Dynamically resolve Lucide icon by name (PascalCase)
          const iconKey = feature.iconName
            ? feature.iconName.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')
            : null
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const IconComp = iconKey ? (Icons as any)[iconKey] : null

          return (
            <div key={idx} className="flex flex-col gap-3">
              {IconComp && (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(226,192,99,0.12)' }}
                >
                  <IconComp className="w-5 h-5" style={{ color: '#E2C063' }} />
                </div>
              )}
              <h3 className="text-fluid-base font-semibold" style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924' }}>
                {feature.title}
              </h3>
              <p className="text-fluid-sm" style={{ color: '#6B6560' }}>{feature.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
