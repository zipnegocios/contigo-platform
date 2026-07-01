import type { PageBlock } from '@/types/pageBlocks'
import { HeroBlock } from './blocks/HeroBlock'
import { RichTextBlock } from './blocks/RichTextBlock'
import { GalleryBlock } from './blocks/GalleryBlock'
import { ProcessBlock } from './blocks/ProcessBlock'
import { TwoColumnBlock } from './blocks/TwoColumnBlock'
import { FeaturesGridBlock } from './blocks/FeaturesGridBlock'
import { CtaBlock } from './blocks/CtaBlock'
import { ImageCarouselBlock } from './blocks/ImageCarouselBlock'
import { ComparisonCardsBlock } from './blocks/ComparisonCardsBlock'
import { WhatsAppCtaBlock } from './blocks/WhatsAppCtaBlock'

interface PageBlockRendererProps {
  blocks: PageBlock[]
}

export function PageBlockRenderer({ blocks }: PageBlockRendererProps) {
  return (
    <div>
      {blocks.map((block) => {
        switch (block.type) {
          case 'hero':             return <HeroBlock            key={block.id} data={block.data} />
          case 'rich-text':        return <RichTextBlock        key={block.id} data={block.data} />
          case 'gallery':          return <GalleryBlock         key={block.id} data={block.data} />
          case 'process':          return <ProcessBlock         key={block.id} data={block.data} />
          case 'two-column':       return <TwoColumnBlock       key={block.id} data={block.data} />
          case 'features-grid':    return <FeaturesGridBlock    key={block.id} data={block.data} />
          case 'cta':             return <CtaBlock             key={block.id} data={block.data} />
          case 'image-carousel':  return <ImageCarouselBlock   key={block.id} data={block.data} />
          case 'comparison-cards': return <ComparisonCardsBlock key={block.id} data={block.data} />
          case 'whatsapp-cta':    return <WhatsAppCtaBlock     key={block.id} data={block.data} />
          default:                return null
        }
      })}
    </div>
  )
}
