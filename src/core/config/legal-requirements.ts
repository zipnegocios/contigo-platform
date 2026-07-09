// Anchors that third-party integrations require to exist as stable H2/H3 ids
// in a given legal document's content. Lives in code (not the DB) because it
// changes with integration deploys, not with content edits. When an
// integration goes live, the same PR that activates it must flip `active` to
// true — from that point publishing a version that drops the anchor fails.
export interface LegalAnchorRequirement {
  anchorId: string
  requiredBy: string
  reference: string
  active: boolean
}

export const LEGAL_ANCHOR_REQUIREMENTS: Record<string, LegalAnchorRequirement[]> = {
  'privacy-policy': [
    {
      anchorId: 'data-deletion',
      requiredBy: 'meta-platform',
      reference: 'https://developers.facebook.com/docs/development/terms-and-policies/privacy-policy/',
      active: false, // activate when Instagram/Facebook integration ships
    },
    {
      anchorId: 'third-party-services',
      requiredBy: 'google-maps-platform',
      reference: 'https://developers.google.com/maps/documentation/places/web-service/policies',
      active: false, // activate when Places API integration ships
    },
  ],
  'website-terms': [
    {
      anchorId: 'third-party-content-and-services',
      requiredBy: 'google-maps-platform',
      reference: 'https://developers.google.com/maps/documentation/places/web-service/policies',
      active: false,
    },
  ],
}

export interface MissingAnchor {
  anchorId: string
  requiredBy: string
  reference: string
}

export function findMissingAnchors(
  slug: string,
  presentAnchors: string[],
  options: { activeOnly: boolean },
): MissingAnchor[] {
  const requirements = LEGAL_ANCHOR_REQUIREMENTS[slug] ?? []
  return requirements
    .filter((r) => (options.activeOnly ? r.active : !r.active))
    .filter((r) => !presentAnchors.includes(r.anchorId))
    .map((r) => ({ anchorId: r.anchorId, requiredBy: r.requiredBy, reference: r.reference }))
}
