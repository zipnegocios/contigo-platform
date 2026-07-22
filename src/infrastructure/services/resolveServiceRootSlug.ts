interface CategoryNode {
  id: string
  slug: string
  parentId: string | null
}

/**
 * Walks a category's parentId chain up to the root and returns the root's
 * slug. The live taxonomy is flat (categories have no parent, services point
 * directly at a root category), so walking all the way to `parentId ===
 * null` is equivalent to "the direct parent" today. If categories ever grow
 * a 3rd level this would need the same "must be a direct child of root"
 * constraint the public service page enforces (see
 * app/(portfolio)/services/[category]/[item]/page.tsx).
 */
export function resolveServiceRootSlug(categoryId: string | null, catById: Map<string, CategoryNode>): string | null {
  if (!categoryId) return null
  let node = catById.get(categoryId)
  if (!node) return null
  const visited = new Set<string>()
  while (node.parentId !== null) {
    if (visited.has(node.id)) return null
    visited.add(node.id)
    const parent = catById.get(node.parentId)
    if (!parent) return null
    node = parent
  }
  return node.slug
}

/** Builds `/services/[root]/[slug]`, or null if the category can't resolve to a valid root. */
export function resolveServicePreviewPath(
  service: { categoryId: string | null; slug: string },
  catById: Map<string, CategoryNode>,
): string | null {
  const rootSlug = resolveServiceRootSlug(service.categoryId, catById)
  return rootSlug ? `/services/${rootSlug}/${service.slug}` : null
}
