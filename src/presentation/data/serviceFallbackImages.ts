import { ServiceRootSlug } from '@/presentation/data/serviceCategoryMeta'

/**
 * Fallback image mapping for each root service category.
 * Maps each ServiceRootSlug to a static asset path in public/assets/.
 */
export const SERVICE_FALLBACK_IMAGES: Record<ServiceRootSlug, string> = {
  carpentry: '/assets/service-carpentry.jpg',
  cladding: '/assets/service-cladding.jpg',
  'gyprock-fixing-flushing': '/assets/service-gyprock.jpg',
  'additional-services': '/assets/service-painting.jpg',
}
