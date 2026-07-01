import type { ProcessBlockData } from '@/types/pageBlocks'

interface ProcessBlockProps { data: ProcessBlockData }

export function ProcessBlock({ data }: ProcessBlockProps) {
  return (
    <section className="max-w-4xl mx-auto px-6 py-12">
      <ol className="space-y-8">
        {data.steps.map((step, idx) => (
          <li key={idx} className="flex gap-6">
            <div
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-fluid-base font-bold"
              style={{ backgroundColor: 'rgba(226,192,99,0.15)', color: '#A07B2A', border: '1.5px solid #E2C063' }}
            >
              {idx + 1}
            </div>
            <div>
              <h3 className="text-fluid-xl font-semibold mb-1" style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924' }}>
                {step.title}
              </h3>
              {step.description && (
                <p className="text-fluid-sm" style={{ color: '#6B6560' }}>{step.description}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
