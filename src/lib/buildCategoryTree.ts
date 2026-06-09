import type { FlatCategory, CategoryNode } from '@/types/category'

export function buildCategoryTree(flat: FlatCategory[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>()
  const roots: CategoryNode[] = []

  for (const cat of flat) {
    map.set(cat.id, { ...cat, children: [] })
  }

  for (const cat of flat) {
    const node = map.get(cat.id)!
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sortByOrder = (nodes: CategoryNode[]): CategoryNode[] => {
    nodes.sort((a, b) => a.orderIndex - b.orderIndex)
    for (const node of nodes) sortByOrder(node.children)
    return nodes
  }

  return sortByOrder(roots)
}

export function flattenTree(tree: CategoryNode[]): FlatCategory[] {
  const result: FlatCategory[] = []
  const walk = (nodes: CategoryNode[]) => {
    for (const node of nodes) {
      const { children: _, ...flat } = node
      result.push(flat)
      walk(node.children)
    }
  }
  walk(tree)
  return result
}

export function getDescendantIds(flat: FlatCategory[], id: string): string[] {
  const children = flat.filter((c) => c.parentId === id)
  return children.flatMap((c) => [c.id, ...getDescendantIds(flat, c.id)])
}

export function getCategoryPath(flat: FlatCategory[], id: string): FlatCategory[] {
  const path: FlatCategory[] = []
  let current = flat.find((c) => c.id === id)
  while (current) {
    path.unshift(current)
    current = current.parentId ? flat.find((c) => c.id === current!.parentId) : undefined
  }
  return path
}
