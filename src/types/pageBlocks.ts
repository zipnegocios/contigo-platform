export type PageBlock =
  | { id: string; type: 'hero';             data: HeroBlockData }
  | { id: string; type: 'rich-text';        data: RichTextBlockData }
  | { id: string; type: 'gallery';          data: GalleryBlockData }
  | { id: string; type: 'process';          data: ProcessBlockData }
  | { id: string; type: 'two-column';       data: TwoColumnBlockData }
  | { id: string; type: 'features-grid';    data: FeaturesGridBlockData }
  | { id: string; type: 'cta';             data: CtaBlockData }
  | { id: string; type: 'image-carousel';   data: ImageCarouselBlockData }
  | { id: string; type: 'comparison-cards'; data: ComparisonCardsBlockData }
  | { id: string; type: 'whatsapp-cta';     data: WhatsAppCtaBlockData }

export interface HeroBlockData {
  imageUrl: string
  videoUrl?: string
  title: string
  subtitle?: string
  overlayOpacity: number  // 0-100
}

export interface RichTextBlockData {
  html: string
}

export interface GalleryBlockData {
  items: Array<{ url: string; order: number }>
}

export interface ProcessBlockData {
  steps: Array<{ title: string; description: string }>
}

export interface TwoColumnBlockData {
  imageUrl: string
  imageSide: 'left' | 'right'
  title?: string
  text: string
}

export interface FeaturesGridBlockData {
  features: Array<{ iconName: string; title: string; description: string }>
}

export interface CtaBlockData {
  title?: string
  subtitle?: string
  primaryBtn: { label: string; href: string }
  secondaryBtn?: { label: string; href: string }
}

export interface ImageCarouselBlockData {
  images: Array<{ url: string; caption?: string }>
}

export interface ComparisonCardsBlockData {
  cards: Array<{ title: string; imageUrl?: string; points: string[] }>
}

export interface WhatsAppCtaBlockData {
  phoneNumber: string
  message: string
  label: string
  style: 'button' | 'banner'
}

// Default data for each block type (used when adding a new block)
export const BLOCK_DEFAULTS: { [K in PageBlock['type']]: Extract<PageBlock, { type: K }>['data'] } = {
  'hero':             { imageUrl: '', title: '', subtitle: '', overlayOpacity: 40 },
  'rich-text':        { html: '<p>Enter your text here.</p>' },
  'gallery':          { items: [] },
  'process':          { steps: [{ title: 'Step 1', description: '' }] },
  'two-column':       { imageUrl: '', imageSide: 'left', title: '', text: '' },
  'features-grid':    { features: [{ iconName: 'check', title: '', description: '' }] },
  'cta':             { title: '', subtitle: '', primaryBtn: { label: 'Request a Quote', href: '/#contact' } },
  'image-carousel':  { images: [] },
  'comparison-cards': { cards: [{ title: 'Option A', points: [''] }] },
  'whatsapp-cta':    { phoneNumber: '', message: 'Hi, I\'m interested in your services.', label: 'Chat on WhatsApp', style: 'button' },
}

export const BLOCK_LABELS: Record<PageBlock['type'], string> = {
  'hero':             'Hero / Banner',
  'rich-text':        'Rich Text',
  'gallery':          'Gallery',
  'process':          'Process / Steps',
  'two-column':       'Two Column',
  'features-grid':    'Features Grid',
  'cta':             'CTA Block',
  'image-carousel':  'Image Carousel',
  'comparison-cards': 'Comparison Cards',
  'whatsapp-cta':    'WhatsApp CTA',
}
