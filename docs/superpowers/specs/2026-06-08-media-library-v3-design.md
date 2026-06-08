# Media Library v3 — Design Spec
**Date:** 2026-06-08  
**Status:** Approved  
**Design system:** Contigo luxury gold/dark (`#E2C063`, `#1E1A16`, `#FAF6F0`, Cormorant)

---

## Goals

Upgrade `/admin/media` from a basic grid with a Bank tab stub into a fully-featured media management system covering:
1. Context-driven state management (no prop-drilling)
2. Drag & drop file organization across all tabs + Bank sidebar
3. Advanced search with expandable filter panel
4. Sliding detail drawer with full metadata + assign-to-entity actions
5. Clear association display in Browse Library (MediaPickerModal)

---

## Architecture: Option B — Context + Modules

### `MediaLibraryContext`

Single source of truth for all media library state. Wraps the `/admin/media` page and optionally the `MediaPickerModal` when opened with an entity context.

```typescript
interface AdvancedFilters {
  mediaType: 'all' | 'image' | 'video'
  folderId: string | null        // null = all folders
  tagNames: string[]             // AND logic
  associatedWith: { entityType: 'project' | 'service'; title: string } | null
  dateRange: { from: string; to: string } | null
}

interface EntityContext {
  type: 'project' | 'service'
  id: string
  name: string
}

interface MediaLibraryContextValue {
  items: MediaObject[]
  folders: MediaFolder[]
  tags: MediaTag[]
  loading: boolean
  searchQuery: string
  setSearchQuery: (q: string) => void
  filters: AdvancedFilters
  setFilters: (f: Partial<AdvancedFilters>) => void
  filteredItems: MediaObject[]         // memoized derived
  activeFolderId: string | null        // Bank sidebar selection
  setActiveFolderId: (id: string | null) => void
  selectedTagNames: string[]           // Bank tag filter
  toggleTag: (name: string) => void
  detailItem: MediaObject | null
  openDetail: (item: MediaObject) => void
  closeDetail: () => void
  entityContext: EntityContext | null  // set by ProjectForm/ServiceForm
  moveToFolder: (key: string, folderId: string | null) => Promise<void>
  updateMetadata: (key: string, patch: Partial<MediaMetadata>) => Promise<void>
  deleteItem: (key: string) => Promise<void>
  refreshItems: () => Promise<void>
  createFolder: (name: string, parentId?: string) => Promise<MediaFolder>
  deleteFolder: (id: string) => Promise<void>
  renameFolder: (id: string, name: string) => Promise<void>
  createTag: (name: string, color: string) => Promise<MediaTag>
  deleteTag: (id: string) => Promise<void>
}
```

`filteredItems` is computed with `useMemo` applying: searchQuery (filename match) + AdvancedFilters + Bank activeFolderId + selectedTagNames.

---

## Component Tree

```
MediaLibraryProvider
└── MediaLibrary.tsx (~120 lines, orchestration only)
    ├── MediaSearchBar.tsx
    │   └── AdvancedFiltersPanel (collapsible below search bar)
    ├── [Tabs row + Upload button]
    └── div.flex.gap-5
        ├── MediaBankSidebar.tsx   (Bank tab only)
        │   ├── FolderTree         (DnD drop zones, rename inline, delete)
        │   └── TagPanel           (color chips, create/delete)
        ├── AssociationSidebar.tsx (non-Bank tabs — extracted from current code)
        ├── MediaGrid.tsx
        │   └── MediaCard.tsx[]    (DnD source, context menu on right-click)
        └── MediaDetailDrawer.tsx  (right-side sliding panel, 380px)
            ├── MediaPreview       (img/video, 16:9)
            ├── MetadataGrid       (dims, AR, size, format, duration)
            ├── FolderTagEditor    (inline assign folder/tags/notes)
            ├── AssociationsList
            └── ActionBar          ("Usar como Cover" / "Agregar a Galería")
                └── AssignToEntityModal (project/service picker)
```

New files to create:
| File | Role |
|---|---|
| `src/presentation/components/admin/MediaLibraryContext.tsx` | Context + Provider + all mutations |
| `src/presentation/components/admin/MediaSearchBar.tsx` | Search input + collapsible advanced filters |
| `src/presentation/components/admin/MediaBankSidebar.tsx` | Bank sidebar: folder tree + tag panel (DnD drop zones) |
| `src/presentation/components/admin/MediaGrid.tsx` | Grid with DnD drag sources + right-click context menu |
| `src/presentation/components/admin/MediaCard.tsx` | Individual card (extracted, DnD-aware) |
| `src/presentation/components/admin/MediaDetailDrawer.tsx` | Sliding right panel with full metadata + actions |
| `src/presentation/components/admin/AssignToEntityModal.tsx` | Picker: choose project/service + field (cover/gallery) |

Files to refactor:
| File | Change |
|---|---|
| `MediaLibrary.tsx` | Reduce to ~120-line orchestrator, consume Context |
| `MediaPickerModal.tsx` | Accept `entityContext` prop, show association badges on cards |
| `MediaDetailsModal.tsx` | Deprecate (replaced by MediaDetailDrawer) — keep for backward compat |

---

## Feature Specs

### 1. Drag & Drop — File to Folder

**Library:** `@dnd-kit/core` (already installed).

- Every `MediaCard` is a `<Draggable>` source. `data.key` = R2 key.
- **Bank sidebar** FolderRow items are `<Droppable>` targets. Active drop zone highlighted with gold border pulse.
- **All tabs** (not just Bank): when dragging starts, a mini folder sidebar slides in from the right edge of the screen (or the Bank sidebar becomes visible as an overlay) showing all folders as drop targets.
- On drop: call `moveToFolder(key, folderId)` → PATCH `/api/admin/media/metadata` → optimistic update in Context.
- Visual feedback: card becomes 60% opacity + dashed border while dragging. Drop zone scales up 1.03 + gold glow.

### 2. Context Menu (Right-click)

Available on every `MediaCard` in every tab:
- Move to Folder → submenu with folder names
- Add Tags → submenu with tag chips
- View Details → opens DetailDrawer
- Delete → confirm dialog

Implemented as a custom `ContextMenu` component (no external lib — pure CSS `position:fixed` with `onContextMenu` capture). Dismisses on click-outside or `Escape`.

### 3. Search Bar + Advanced Filters

**Always visible** above the tab row.

```
[ 🔍 Search by filename, project, tag...     ] [⚙ Filters (2)] [✕]
─── Advanced panel (collapsible) ──────────────────────────────────
Type: [All] [Images] [Videos]
Folder: [dropdown]
Tags: [chip multi-select]
Associated with: [dropdown: All / Project: X / Service: Y]
Date modified: [from] — [to]
                                            [Clear filters] [Apply]
```

Filter badge count shows active non-default filters. All filters applied in real time (no "Apply" needed for search query; Apply button resets debounce for advanced filters).

### 4. Media Detail Drawer

**Right-side sliding panel** — 380px wide, `translateX` animation 200ms ease-out. Does NOT close the main grid; grid shrinks by 380px (flex). On mobile (< 768px): full-screen overlay.

Sections from top to bottom:
1. **Header**: filename truncated, close button (×), external link icon
2. **Preview**: 16:9, `object-contain`, supports both image and video (with controls)
3. **Metadata grid** (2-col):
   - Dimensions: `1920 × 1080px`
   - Aspect Ratio: `16:9`  
   - Size: `2.4 MB`
   - Format: `JPEG` / `MP4`
   - Duration: `0:42` (video only)
   - Last modified: date
4. **Organization** (inline edit):
   - Folder dropdown
   - Tag chips (multi-select)
   - Notes textarea (auto-saves on blur)
5. **Used In** — association list (same as current MediaDetailsModal)
6. **Action Bar** (sticky bottom):
   - `Usar como Cover` → opens AssignToEntityModal or auto-assigns if entityContext set
   - `Agregar a Galería` → same
   - `Copiar URL` icon button
   - `Eliminar` icon button (danger, confirm)

### 5. AssignToEntityModal

Opens from the DetailDrawer ActionBar when no `entityContext` is set (standalone mode).

```
┌─ Asignar medio ────────────────────┐
│ [Cover Image preview]              │
│                                    │
│ ASIGNAR COMO                       │
│ ○ Cover Image                      │
│ ○ Agregar a Galería                │
│                                    │
│ PROYECTO / SERVICIO                │
│ [Searchable dropdown]              │
│  ├ Projects                        │
│  │  ├ Casa Moderna Belgrano        │
│  │  └ Torre Palermo                │
│  └ Services                        │
│     └ Diseño Interior              │
│                                    │
│ [Cancelar]  [Asignar]             │
└────────────────────────────────────┘
```

On confirm: calls `PATCH /api/admin/projects/[id]` or `PATCH /api/admin/services/[id]` with the updated `coverImageUrl` or appended `galleryItems`.

When `entityContext` IS set (from ProjectForm/ServiceForm): skips modal, shows inline confirmation toast.

### 6. Browse Library Improvements (MediaPickerModal)

Add to each card:
- **Association badge**: small pill bottom-left showing "Cover — Casa Moderna" in gold if the item is used somewhere.
- When `entityContext` is passed: items used in *that* entity get a green checkmark badge "Ya asignado".
- Filter dropdown (already implemented) now loads with `withAssociations=1` always.
- Selected items get a gold border + checkmark (already implemented) — keep.

---

## Design Tokens (applied consistently)

```
bg-dark:     #16120E, #1E1A16
bg-content:  #FAF6F0
gold:        #E2C063  (rgba(226,192,99,x) at various opacities)
text-primary: #E8DCC4
text-secondary: #A89E8C
text-muted:  #6B6560
danger:      #e87070
success:     #52B788
font-heading: var(--font-cormorant)
border-card: 1px solid rgba(226,192,99,0.12)
border-active: 1px solid rgba(226,192,99,0.4)
radius:      rounded-xl (12px), rounded-2xl (16px)
shadow:      0 24px 60px rgba(0,0,0,0.35)
```

---

## API Changes Required

| Route | Method | Change |
|---|---|---|
| `/api/admin/projects/[id]` | PATCH | Must accept `{ coverImageUrl }` or `{ galleryItems: [...append] }` partial update |
| `/api/admin/services/[id]` | PATCH | Same |
| `/api/admin/media/metadata` | PATCH | Already exists — no change |
| `/api/admin/media/folders` | PATCH | Already exists (rename) |

No new API routes needed.

---

## DnD Implementation Notes

- Use `@dnd-kit/core` `DndContext` wrapping the entire `MediaLibrary` (not just Bank tab)
- `MediaCard` uses `useDraggable({ id: item.key, data: { key: item.key } })`
- Folder rows use `useDroppable({ id: folder.id, data: { folderId: folder.id } })`
- `DragOverlay`: shows a mini thumbnail of the dragged card
- `onDragEnd`: if `over` is a folder drop zone → `moveToFolder(active.data.key, over.data.folderId)`
- "Floating folder targets" when dragging from non-Bank tabs: a `DragOverlayFolderPanel` appears as a fixed right-side panel (`z-50`) showing folder rows as drop zones

---

## Out of Scope

- Bulk selection / multi-file operations (separate future feature)
- Nested subfolder display beyond 2 levels in UI (DB supports it, UI shows flat with indent)
- R2 file rename on folder move (folder is metadata-only, R2 key unchanged)
- Image cropping / editing

---

## Implementation Order

1. `MediaLibraryContext.tsx` — Context + all data fetching + mutations
2. `MediaCard.tsx` — extracted card with `useDraggable`
3. `MediaGrid.tsx` — grid + DnD context + context menu
4. `MediaBankSidebar.tsx` — folder tree + tag panel + `useDroppable`
5. `MediaSearchBar.tsx` — search + advanced filters panel
6. `MediaDetailDrawer.tsx` — sliding panel + all sections
7. `AssignToEntityModal.tsx` — project/service picker
8. `MediaLibrary.tsx` — refactor to orchestrator
9. `MediaPickerModal.tsx` — add association badges + entityContext support
10. TypeScript check + build verification
