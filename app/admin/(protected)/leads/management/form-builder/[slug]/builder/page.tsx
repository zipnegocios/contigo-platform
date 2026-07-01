import { notFound } from 'next/navigation'
import { DrizzleFormRepository } from '@/infrastructure/repositories/DrizzleFormRepository'
import { FormPageBuilder } from '@/presentation/components/admin/form-builder/FormPageBuilder'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function FormBuilderEditorPage({ params }: Props) {
  const { slug } = await params
  const repo = new DrizzleFormRepository()

  const [activeVersion, versions] = await Promise.all([
    repo.findActiveVersionBySlug(slug),
    repo.findVersionsBySlug(slug),
  ])

  if (!activeVersion) notFound()

  const formRow = await repo.findBySlug(slug)
  const formName = formRow ? (await repo.findById(formRow.formId))?.name ?? slug : slug

  const initialFields = activeVersion.schema.steps[0]?.fields ?? []

  return (
    <FormPageBuilder
      slug={slug}
      formName={formName}
      initialFields={initialFields}
      versions={versions}
    />
  )
}
