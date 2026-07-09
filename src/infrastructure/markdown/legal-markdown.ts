import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import { visit } from 'unist-util-visit'
import type { Element, Root } from 'hast'

// Shared remark/rehype plugin chain — used identically by the public
// /legal/[slug] page and the admin editor preview, so what an editor sees
// while drafting is exactly what ships. rehype-sanitize strips any HTML
// that slipped in (react-markdown skips raw HTML by default already, this
// is defense in depth) — no raw HTML is ever rendered in legal content.
export const legalMarkdownRemarkPlugins = [remarkGfm]
export const legalMarkdownRehypePlugins = [rehypeSlug, [rehypeSanitize, defaultSchema]] as const

// Extracts the slugified ids rehype-slug would assign to every H2/H3 in the
// given markdown. Must use the exact same plugin chain as the render path
// (remark-rehype + rehype-slug) so ids are byte-for-byte identical — this is
// what PublishLegalDocumentUseCase checks against LEGAL_ANCHOR_REQUIREMENTS.
export function extractHeadingIds(markdown: string): string[] {
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .runSync(unified().use(remarkParse).use(remarkGfm).parse(markdown)) as Root

  const ids: string[] = []
  visit(tree, 'element', (node: Element) => {
    if ((node.tagName === 'h2' || node.tagName === 'h3') && typeof node.properties?.id === 'string') {
      ids.push(node.properties.id)
    }
  })
  return ids
}
