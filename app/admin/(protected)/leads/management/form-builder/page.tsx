import { DrizzleFormRepository } from '@/infrastructure/repositories/DrizzleFormRepository'
import { FormBuilder } from '@/presentation/components/admin/form-builder/FormBuilder'

const REQUEST_A_QUOTE_SLUG = 'request-a-quote'

export default async function FormBuilderPage() {
  const formRepository = new DrizzleFormRepository()
  const activeVersion = await formRepository.findActiveVersionBySlug(REQUEST_A_QUOTE_SLUG)

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-fluid-4xl font-semibold"
          style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924', lineHeight: 1.2 }}
        >
          Form Builder
        </h1>
        <p className="text-fluid-sm mt-1" style={{ color: '#6B6560' }}>
          Drag fields onto the canvas, reorder them, and configure each one before saving a new version of
          &ldquo;Request a Quote&rdquo;.
        </p>
      </div>

      {activeVersion ? (
        <FormBuilder slug={REQUEST_A_QUOTE_SLUG} initialSchema={activeVersion.schema} />
      ) : (
        <p className="text-fluid-sm" style={{ color: '#6B6560' }}>
          No active form schema found for &ldquo;{REQUEST_A_QUOTE_SLUG}&rdquo;.
        </p>
      )}
    </div>
  )
}
