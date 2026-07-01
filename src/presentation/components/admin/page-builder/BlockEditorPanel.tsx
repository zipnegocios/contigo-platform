'use client'

import type { PageBlock } from '@/types/pageBlocks'
import { BLOCK_LABELS } from '@/types/pageBlocks'
import { HeroEditor } from './editors/HeroEditor'
import { RichTextEditor } from './editors/RichTextEditor'
import { GalleryEditor } from './editors/GalleryEditor'
import { ProcessEditor } from './editors/ProcessEditor'
import { TwoColumnEditor } from './editors/TwoColumnEditor'
import { FeaturesGridEditor } from './editors/FeaturesGridEditor'
import { CtaEditor } from './editors/CtaEditor'
import { ImageCarouselEditor } from './editors/ImageCarouselEditor'
import { ComparisonCardsEditor } from './editors/ComparisonCardsEditor'
import { WhatsAppCtaEditor } from './editors/WhatsAppCtaEditor'
import { CustomEditor } from './editors/CustomEditor'
import { FormBlockEditor } from './editors/FormBlockEditor'

interface BlockEditorPanelProps {
  block: PageBlock
  onChange: (data: PageBlock['data']) => void
}

export function BlockEditorPanel({ block, onChange }: BlockEditorPanelProps) {
  return (
    <div style={{ borderTop: '1px solid #E5DDD0' }}>
      <div className="px-4 py-2.5" style={{ backgroundColor: '#F5EFE8', borderBottom: '1px solid #E5DDD0' }}>
        <p className="text-fluid-xs font-semibold" style={{ color: '#2D2924' }}>
          Editing: {BLOCK_LABELS[block.type]}
        </p>
      </div>
      <div className="p-4 space-y-4">
        {block.type === 'hero'             && <HeroEditor            data={block.data} onChange={onChange} />}
        {block.type === 'rich-text'        && <RichTextEditor        data={block.data} onChange={onChange} />}
        {block.type === 'gallery'          && <GalleryEditor         data={block.data} onChange={onChange} />}
        {block.type === 'process'          && <ProcessEditor         data={block.data} onChange={onChange} />}
        {block.type === 'two-column'       && <TwoColumnEditor       data={block.data} onChange={onChange} />}
        {block.type === 'features-grid'    && <FeaturesGridEditor    data={block.data} onChange={onChange} />}
        {block.type === 'cta'              && <CtaEditor             data={block.data} onChange={onChange} />}
        {block.type === 'image-carousel'   && <ImageCarouselEditor   data={block.data} onChange={onChange} />}
        {block.type === 'comparison-cards' && <ComparisonCardsEditor data={block.data} onChange={onChange} />}
        {block.type === 'whatsapp-cta'     && <WhatsAppCtaEditor     data={block.data} onChange={onChange} />}
        {block.type === 'custom'           && <CustomEditor           data={block.data} onChange={onChange} />}
        {block.type === 'form'             && <FormBlockEditor        data={block.data} onChange={onChange} />}
      </div>
    </div>
  )
}
