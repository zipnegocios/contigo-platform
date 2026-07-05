// The 9 granular permission scopes seeded in `permissions` (Fase 4.1, §7.1).
// Hardcoded client-side since this is a small, stable, already-seeded set —
// see src/infrastructure/db/migrations/20260622152709_seed_permissions_and_backfill_owner_grants.sql
export const PERMISSION_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'leads.view', label: 'View Leads' },
  { key: 'leads.edit', label: 'Edit Leads' },
  { key: 'leads.archive', label: 'Archive Leads' },
  { key: 'leads.delete', label: 'Delete Leads Permanently' },
  { key: 'pipeline.manage', label: 'Manage Pipeline' },
  { key: 'tasks.manage', label: 'Manage Tasks' },
  { key: 'form_builder.manage', label: 'Manage Form Builder' },
  { key: 'users.manage', label: 'Manage Users' },
  { key: 'media.manage', label: 'Manage Media' },
  { key: 'settings.manage', label: 'Manage Settings' },
]
