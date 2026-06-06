/**
 * Generates URL-friendly slugs from strings
 * Converts to lowercase, replaces spaces with hyphens, removes special characters
 */
export function generateSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s]+/g, '-') // Replace spaces with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
}
