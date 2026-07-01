'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import type { RichTextBlockData } from '@/types/pageBlocks'

interface RichTextEditorProps {
  data: RichTextBlockData
  onChange: (data: RichTextBlockData) => void
}

export function RichTextEditor({ data, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: data.html,
    onUpdate: ({ editor: e }) => {
      onChange({ html: e.getHTML() })
    },
  })

  if (!editor) return null

  const btn = (label: string, action: () => boolean, isActive?: boolean) => (
    <button
      key={label}
      type="button"
      onMouseDown={(e) => { e.preventDefault(); action() }}
      className="px-2 py-1 rounded text-fluid-xs font-medium transition-all"
      style={{
        backgroundColor: isActive ? 'rgba(226,192,99,0.2)' : 'transparent',
        color: isActive ? '#A07B2A' : '#6B6560',
        border: isActive ? '1px solid #E2C063' : '1px solid transparent',
      }}
    >
      {label}
    </button>
  )

  return (
    <div>
      <div
        className="flex flex-wrap gap-1 p-2 mb-0 rounded-t-lg"
        style={{ backgroundColor: '#F0EBE3', border: '1px solid #E5DDD0', borderBottom: 'none' }}
      >
        {btn('H1', () => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive('heading', { level: 1 }))}
        {btn('H2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
        {btn('H3', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }))}
        {btn('B', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
        {btn('I', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
        {btn('• List', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
        {btn('1. List', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none min-h-[120px] px-3 py-2 rounded-b-lg outline-none"
        style={{ backgroundColor: '#F0EBE3', border: '1px solid #E5DDD0', color: '#2D2924', fontSize: '0.875rem' }}
      />
    </div>
  )
}
