'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { HeroSlide } from '@/core/entities/HeroConfig'
import { HeroImagePair } from './HeroImagePair'
import { ButtonsManager } from './ButtonsManager'

interface EntityOption { id: string; label: string; slug: string }

interface Props {
  slides: HeroSlide[]
  onChange: (slides: HeroSlide[]) => void
  serviceOptions: EntityOption[]
  projectOptions: EntityOption[]
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid #E5DDD0',
  borderRadius: 6, fontSize: '0.875rem', color: '#2D2924', background: '#fff',
  outline: 'none', boxSizing: 'border-box',
}

function SortableThumb({ slide, index, isActive, onClick, onDelete }: {
  slide: HeroSlide
  index: number
  isActive: boolean
  onClick: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: slide.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        position: 'relative',
        width: 80,
        height: 60,
        flexShrink: 0,
        borderRadius: 6,
        overflow: 'hidden',
        cursor: 'pointer',
        outline: isActive ? '2px solid #E2C063' : '2px solid transparent',
        outlineOffset: 2,
        background: '#E5DDD0',
      }}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      {slide.desktopImageUrl && (
        <img src={slide.desktopImageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      <span style={{
        position: 'absolute', bottom: 3, left: 4,
        fontSize: 9, fontWeight: 700, color: '#fff',
        textShadow: '0 1px 2px rgba(0,0,0,0.7)',
      }}>
        {index + 1}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        style={{
          position: 'absolute', top: 2, right: 2,
          background: 'rgba(18,14,10,0.65)', border: 'none', borderRadius: 3,
          color: '#fff', width: 18, height: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <X size={10} />
      </button>
    </div>
  )
}

export function SlidesList({ slides, onChange, serviceOptions, projectOptions }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(slides[0]?.id ?? null)
  const sensors = useSensors(useSensor(PointerSensor))

  const selectedSlide = slides.find((s) => s.id === selectedId) ?? null

  function addSlide() {
    const newSlide: HeroSlide = {
      id: crypto.randomUUID(),
      desktopImageUrl: '',
      headline: 'New slide',
      buttons: [],
    }
    onChange([...slides, newSlide])
    setSelectedId(newSlide.id)
  }

  function deleteSlide(id: string) {
    const next = slides.filter((s) => s.id !== id)
    onChange(next)
    if (selectedId === id) setSelectedId(next[0]?.id ?? null)
  }

  function patchSlide(patch: Partial<HeroSlide>) {
    if (!selectedId) return
    onChange(slides.map((s) => (s.id === selectedId ? { ...s, ...patch } : s)))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIdx = slides.findIndex((s) => s.id === active.id)
      const newIdx = slides.findIndex((s) => s.id === over.id)
      onChange(arrayMove(slides, oldIdx, newIdx))
    }
  }

  return (
    <div>
      {/* Thumbnail strip */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={slides.map((s) => s.id)} strategy={horizontalListSortingStrategy}>
            {slides.map((slide, i) => (
              <SortableThumb
                key={slide.id}
                slide={slide}
                index={i}
                isActive={selectedId === slide.id}
                onClick={() => setSelectedId(slide.id)}
                onDelete={() => deleteSlide(slide.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* Add slide card */}
        <button
          onClick={addSlide}
          style={{
            width: 80, height: 60, flexShrink: 0, borderRadius: 6,
            border: '2px dashed #E5DDD0', background: 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#C5B99A',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#E2C063'; e.currentTarget.style.color = '#E2C063' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5DDD0'; e.currentTarget.style.color = '#C5B99A' }}
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Slide editor */}
      {selectedSlide && (
        <div style={{ marginTop: 20 }}>
          <div style={{ background: '#fff', border: '1px solid #E5DDD0', borderRadius: 10, padding: '1.25rem', marginBottom: 12 }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B6560', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Images</p>
            <HeroImagePair
              desktopImageUrl={selectedSlide.desktopImageUrl || undefined}
              mobileImageUrl={selectedSlide.mobileImageUrl}
              onChange={(desktop, mobile) => patchSlide({ desktopImageUrl: desktop ?? '', mobileImageUrl: mobile })}
            />
          </div>

          <div style={{ background: '#fff', border: '1px solid #E5DDD0', borderRadius: 10, padding: '1.25rem', marginBottom: 12 }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B6560', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Content</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B6560', marginBottom: 4 }}>Eyebrow (optional)</label>
                <input style={inputStyle} value={selectedSlide.eyebrow ?? ''} onChange={(e) => patchSlide({ eyebrow: e.target.value || undefined })} placeholder="e.g. Adelaide, South Australia" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B6560', marginBottom: 4 }}>Headline</label>
                <input style={inputStyle} value={selectedSlide.headline} onChange={(e) => patchSlide({ headline: e.target.value })} placeholder="Slide headline" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B6560', marginBottom: 4 }}>Subtitle (optional)</label>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} value={selectedSlide.subtitle ?? ''} onChange={(e) => patchSlide({ subtitle: e.target.value || undefined })} placeholder="Supporting text" />
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #E5DDD0', borderRadius: 10, padding: '1.25rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B6560', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Call to Action</p>
            <ButtonsManager
              buttons={selectedSlide.buttons}
              serviceOptions={serviceOptions}
              projectOptions={projectOptions}
              onChange={(btns) => patchSlide({ buttons: btns })}
            />
          </div>
        </div>
      )}

      {slides.length === 0 && (
        <p style={{ textAlign: 'center', color: '#6B6560', fontSize: '0.875rem', marginTop: 16 }}>
          No slides yet. Click + to add your first slide.
        </p>
      )}
    </div>
  )
}
