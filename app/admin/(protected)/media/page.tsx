import { MediaLibrary } from '@/presentation/components/admin/MediaLibrary'

export default function MediaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-fluid-4xl font-semibold"
          style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924', lineHeight: 1.2 }}
        >
          Media Library
        </h1>
        <p className="text-fluid-sm mt-1" style={{ color: '#6B6560' }}>
          Manage images and videos stored in R2
        </p>
      </div>
      <MediaLibrary />
    </div>
  )
}
