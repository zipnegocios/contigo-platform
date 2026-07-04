export const CLIENT_STAGE_LABELS: Record<string, { label: string; description: string }> = {
  prospect:  { label: 'Request Received', description: "We've received your request and our team is reviewing the details." },
  contacted: { label: 'In Review',        description: 'Our team is assessing your project and may reach out with questions.' },
  quoted:    { label: 'Quote Ready',      description: 'Your quote is ready — you can view it in the documents section below.' },
  won:       { label: 'Project Confirmed', description: "Your project is confirmed. We'll keep you updated here." },
  lost:      { label: 'Closed',           description: 'This request has been closed. Feel free to contact us anytime.' },
}

export const CLIENT_STAGE_FALLBACK = { label: 'In Progress', description: 'Your project is moving forward.' }

/**
 * Safe lookup for client-facing stage labels.
 * Returns the mapped label and description for a given pipeline stage key.
 * If the key is not found, returns the fallback label to avoid exposing unknown internal keys.
 */
export function getClientStageLabel(key: string): { label: string; description: string } {
  return CLIENT_STAGE_LABELS[key] ?? CLIENT_STAGE_FALLBACK
}
