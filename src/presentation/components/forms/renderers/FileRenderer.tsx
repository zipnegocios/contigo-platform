import type { FieldComponentProps } from '../types'

/**
 * Not yet implemented. No schema field in this codebase uses a FileRenderer
 * type (file_upload_single/file_upload_multi/image_upload/dropzone/
 * media_library_picker/signature/camera_capture) as a generic form field —
 * QuoteForm's attachment upload is a sidecar feature outside the form
 * schema, not this renderer. This stub exists only so `FormRenderer` has
 * something to dispatch to. Real file-upload UI is out of scope for
 * Task 4.2.3.
 */
export function FileRenderer({ field }: FieldComponentProps) {
  return <div>Unsupported field type: {field.type}</div>
}
