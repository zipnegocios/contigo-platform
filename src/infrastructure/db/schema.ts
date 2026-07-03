import {
  pgTable,
  text,
  varchar,
  timestamp,
  uuid,
  integer,
  boolean,
  jsonb,
  pgEnum,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import type { GalleryItem } from '@/types/media'
import type { PageBlock } from '@/types/pageBlocks'

// ============ ENUMS ============
export const quoteStatusEnum = pgEnum('quote_status', [
  'new',
  'contacted',
  'in_progress',
  'converted',
  'closed',
])

export const projectStatusEnum = pgEnum('project_status', [
  'draft',
  'published',
  'archived',
])

export const leadStageEnum = pgEnum('lead_stage', [
  'prospect',
  'contacted',
  'quoted',
  'won',
  'lost',
])

export const adminRoleEnum = pgEnum('admin_role', ['owner', 'staff'])

export const leadEventTypeEnum = pgEnum('lead_event_type', ['call', 'site_visit', 'meeting', 'follow_up'])

export const leadEventStatusEnum = pgEnum('lead_event_status', [
  'scheduled',
  'completed',
  'cancelled',
  'no_show',
])

export const leadDocumentDirectionEnum = pgEnum('lead_document_direction', [
  'client_upload',
  'admin_sent',
  'internal',
])

export const leadDocumentCategoryEnum = pgEnum('lead_document_category', [
  'reference_photo',
  'site_photo',
  'quote_pdf',
  'contract',
  'other',
])

export const leadContactRoleEnum = pgEnum('lead_contact_role', [
  'owner',
  'site_manager',
  'spouse',
  'other',
])

export const leadActivityTypeEnum = pgEnum('lead_activity_type', [
  'stage_change',
  'note',
  'call_scheduled',
  'call_completed',
  'call_cancelled',
  'visit_scheduled',
  'visit_completed',
  'visit_cancelled',
  'event_scheduled',
  'event_completed',
  'event_cancelled',
  'document_uploaded',
  'document_sent',
  'email_sent',
  'quote_status_changed',
])

export const taskStatusEnum = pgEnum('task_status', ['open', 'in_progress', 'done'])

export const categoryStatusEnum = pgEnum('category_status', ['draft', 'active', 'inactive'])

// ============ LEAD CONTACT ROLES TABLE ============
// Replaces leadContactRoleEnum: a real table lets admins add new roles from
// the UI (combobox "create new") without an ALTER TYPE on a Postgres enum.
// Must be declared before leadContacts due to the FK reference.
export const leadContactRoles = pgTable('lead_contact_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 50 }).notNull().unique(),
  label: varchar('label', { length: 100 }).notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ============ PIPELINE STAGES TABLE ============
// Replaces leadStageEnum: a real table lets admins rename/reorder/create
// stages from the UI (Kanban) without an ALTER TYPE on a Postgres enum.
// Must be declared before leads due to the FK reference.
export const pipelineStages = pgTable('pipeline_stages', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 50 }).notNull().unique(),
  label: varchar('label', { length: 100 }).notNull(),
  position: integer('position').notNull().default(0),
  color: varchar('color', { length: 7 }).notNull().default('#E2C063'),
  isDefault: boolean('is_default').notNull().default(false),
  terminalKind: varchar('terminal_kind', { length: 10 }), // 'won' | 'lost' | null
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ============ CATEGORIES TABLE ============
// Must be declared before projects and services due to FK references
export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    parentId: uuid('parent_id').references((): AnyPgColumn => categories.id, { onDelete: 'set null' }),
    type: varchar('type', { length: 20 }).notNull().default('project'),
    description: text('description'),
    icon: varchar('icon', { length: 100 }),
    orderIndex: integer('order_index').notNull().default(0),
    status: categoryStatusEnum('status').notNull().default('active'),
    isSystem: boolean('is_system').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_categories_slug').on(table.slug),
    index('idx_categories_is_system').on(table.isSystem),
    index('idx_categories_parent_id').on(table.parentId),
    index('idx_categories_type').on(table.type),
    index('idx_categories_order').on(table.orderIndex),
    index('idx_categories_status').on(table.status),
  ],
)

// ============ FORMS TABLE ============
// Catalog of buildable forms (Fase 4.2 Form Builder). One row per form,
// e.g. the public "Request a Quote" form. activeVersionId points at the
// form_versions row currently live; not a FK to avoid a circular FK cycle
// with form_versions.form_id (enforced at the application layer instead).
export const forms = pgTable('forms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 150 }).notNull(),
  slug: varchar('slug', { length: 150 }).notNull().unique(), // 'request-a-quote'
  activeVersionId: uuid('active_version_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ============ FORM_VERSIONS TABLE ============
// Versioned JSON form definitions. Never edited in place: every save in the
// future drag-and-drop builder creates a new version row. `schema` shape is
// FormSchema — defined in Task 4.2.2.
export const formVersions = pgTable('form_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  formId: uuid('form_id')
    .notNull()
    .references(() => forms.id, { onDelete: 'cascade' }),
  schema: jsonb('schema').notNull(), // FormSchema — ver Task 4.2.2
  version: integer('version').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ============ QUOTES TABLE ============
export const quotes = pgTable(
  'quotes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    service: varchar('service', { length: 255 }).notNull(),
    message: text('message').notNull(),
    status: quoteStatusEnum('status').notNull().default('new'),
    trackingToken: varchar('tracking_token', { length: 255 }).notNull().unique(),
    descriptionVector: jsonb('description_vector').$type<number[]>(),
    attachmentUrls: jsonb('attachment_urls').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    // Form Builder (Fase 4.2): which form version produced this quote, and
    // the full raw submission payload. Nullable FK since quotes created
    // before this feature shipped predate any form_versions row.
    formVersionId: uuid('form_version_id').references(() => formVersions.id),
    formData: jsonb('form_data').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_quotes_status').on(table.status),
    index('idx_quotes_email').on(table.email),
    index('idx_quotes_tracking_token').on(table.trackingToken),
    index('idx_quotes_created_at').on(table.createdAt),
  ],
)

// ============ PROJECTS TABLE ============
export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    title: varchar('title', { length: 255 }).notNull(),
    category: varchar('category', { length: 255 }).notNull(),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    description: text('description').notNull(),
    location: varchar('location', { length: 255 }).notNull(),
    completedDate: timestamp('completed_date', { withTimezone: true }).notNull(),
    featured: boolean('featured').notNull().default(false),
    published: boolean('published').notNull().default(false),
    coverImageUrl: text('cover_image_url').notNull(),
    coverPosterUrl: text('cover_poster_url'),
    galleryUrls: jsonb('gallery_urls').$type<GalleryItem[]>().notNull().default(sql`'[]'::jsonb`),
    descriptionVector: jsonb('description_vector').$type<number[]>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_projects_slug').on(table.slug),
    index('idx_projects_status').on(table.published),
    index('idx_projects_featured').on(table.featured),
    index('idx_projects_created_at').on(table.createdAt),
    index('idx_projects_category_id').on(table.categoryId),
  ],
)

// ============ SERVICES TABLE ============
export const services = pgTable(
  'services',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    shortDescription: text('short_description').notNull(),
    fullDescription: text('full_description').notNull(),
    imageUrl: text('image_url').notNull(),
    posterUrl: text('poster_url'),
    galleryItems: jsonb('gallery_items').$type<GalleryItem[]>().notNull().default(sql`'[]'::jsonb`),
    pageBlocks: jsonb('page_blocks').$type<PageBlock[]>(),
    orderIndex: integer('order_index').notNull().default(0),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    published: boolean('published').notNull().default(true),
    // Form Builder hook (Fase 6 - work order CRM en curso); se conecta cuando ese módulo esté listo, sin lógica todavía.
    requestFormId: uuid('request_form_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_services_order').on(table.orderIndex),
    index('idx_services_category_id').on(table.categoryId),
  ],
)

// ============ LEADS TABLE ============
export const leads = pgTable(
  'leads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    quoteId: uuid('quote_id')
      .notNull()
      .references(() => quotes.id, { onDelete: 'cascade' }),
    // Deprecated: superseded by stageId (FK to pipeline_stages). Left in
    // place until a later migration confirms production reads exclusively
    // from stageId, then drops this column + the lead_stage enum.
    stage: leadStageEnum('stage').notNull().default('prospect'),
    stageId: uuid('stage_id')
      .notNull()
      .references(() => pipelineStages.id),
    estimatedValue: integer('estimated_value'), // cents
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    trashedAt: timestamp('trashed_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_leads_stage').on(table.stage),
    index('idx_leads_stage_id').on(table.stageId),
    index('idx_leads_quote_id').on(table.quoteId),
    index('idx_leads_archived_at').on(table.archivedAt),
    index('idx_leads_trashed_at').on(table.trashedAt),
  ],
)

// ============ LEAD EVENTS TABLE (llamadas, visitas, reuniones) ============
export const leadEvents = pgTable(
  'lead_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    type: leadEventTypeEnum('type').notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    durationMinutes: integer('duration_minutes').notNull().default(30),
    status: leadEventStatusEnum('status').notNull().default('scheduled'),
    location: text('location'), // dirección para visitas, link/teléfono para llamadas
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_lead_events_lead_id').on(table.leadId),
    index('idx_lead_events_scheduled_at').on(table.scheduledAt),
    index('idx_lead_events_status').on(table.status),
    index('idx_lead_events_archived_at').on(table.archivedAt),
  ],
)

// ============ LEAD DOCUMENTS TABLE (fotos y documentos) ============
export const leadDocuments = pgTable(
  'lead_documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    fileKey: text('file_key').notNull(), // key en R2 (contigo-quotes) o key de media library reusado
    fileName: varchar('file_name', { length: 255 }).notNull(),
    mimeType: varchar('mime_type', { length: 100 }),
    direction: leadDocumentDirectionEnum('direction').notNull(),
    category: leadDocumentCategoryEnum('category').notNull().default('other'),
    sourceMediaId: uuid('source_media_id'), // si se reusó una imagen del Media Library/Portfolio
    uploadedBy: uuid('uploaded_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_lead_documents_lead_id').on(table.leadId),
    index('idx_lead_documents_direction').on(table.direction),
    index('idx_lead_documents_archived_at').on(table.archivedAt),
  ],
)

// ============ LEAD NOTES TABLE ============
export const leadNotes = pgTable(
  'lead_notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_lead_notes_lead_id').on(table.leadId),
    index('idx_lead_notes_archived_at').on(table.archivedAt),
  ],
)

// ============ LEAD CONTACTS TABLE ============
export const leadContacts = pgTable(
  'lead_contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    email: varchar('email', { length: 255 }),
    // Deprecated: superseded by roleId (FK to lead_contact_roles). Left in
    // place (per migration plan) until a later, separate migration drops it.
    // Application code no longer writes to this column.
    role: leadContactRoleEnum('role'),
    roleId: uuid('role_id').references(() => leadContactRoles.id, { onDelete: 'set null' }),
    isPrimary: boolean('is_primary').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_lead_contacts_lead_id').on(table.leadId),
    index('idx_lead_contacts_archived_at').on(table.archivedAt),
    index('idx_lead_contacts_role_id').on(table.roleId),
  ],
)

// ============ LEAD ACTIVITIES TABLE (timeline / auditoría) ============
export const leadActivities = pgTable(
  'lead_activities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    type: leadActivityTypeEnum('type').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_lead_activities_lead_id').on(table.leadId),
    index('idx_lead_activities_created_at').on(table.createdAt),
    index('idx_lead_activities_type').on(table.type),
  ],
)

// ============ LEAD TASKS TABLE ============
export const leadTasks = pgTable('lead_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'), // markdown plano — no hay editor rich text instalado en el repo; si se requiere WYSIWYG real, es una dependencia nueva a confirmar en ejecución
  dueDate: timestamp('due_date', { withTimezone: true }),
  status: taskStatusEnum('status').notNull().default('open'),
  assigneeId: uuid('assignee_id').references(() => adminUsers.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
})

// ============ TASK CHECKLIST ITEMS TABLE ============
export const taskChecklistItems = pgTable('task_checklist_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => leadTasks.id, { onDelete: 'cascade' }),
  label: varchar('label', { length: 255 }).notNull(),
  position: integer('position').notNull().default(0),
  isChecked: boolean('is_checked').notNull().default(false),
})

// ============ TASK COMMENTS TABLE ============
export const taskComments = pgTable('task_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => leadTasks.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  authorId: uuid('author_id').references(() => adminUsers.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  editedAt: timestamp('edited_at', { withTimezone: true }),
})

// ============ TASK ATTACHMENTS TABLE ============
export const taskAttachments = pgTable('task_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => leadTasks.id, { onDelete: 'cascade' }),
  key: text('key').notNull(), // key en bucket contigo-quotes, o key de Media Library si se elige desde el picker
  filename: varchar('filename', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ============ MEDIA FOLDERS TABLE ============
export const mediaFolders = pgTable(
  'media_folders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    parentId: uuid('parent_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_media_folders_parent').on(table.parentId)],
)

// ============ MEDIA TAGS TABLE ============
export const mediaTags = pgTable('media_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  color: varchar('color', { length: 7 }).notNull().default('#E2C063'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ============ MEDIA METADATA TABLE ============
export const mediaMetadata = pgTable(
  'media_metadata',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: text('key').notNull().unique(),
    folderId: uuid('folder_id'),
    tags: jsonb('tags').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    notes: text('notes'),
    width: integer('width'),
    height: integer('height'),
    duration: integer('duration'),
    format: varchar('format', { length: 100 }),
    optimized: boolean('optimized').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_media_metadata_key').on(table.key),
    index('idx_media_metadata_folder').on(table.folderId),
  ],
)

// ============ ADMIN_USERS TABLE ============
export const adminUsers = pgTable('admin_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: adminRoleEnum('role').notNull().default('staff'),
  // Staff profile fields (additive, nullable: no existing data to backfill).
  title: varchar('title', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  isActive: boolean('is_active').notNull().default(true),
  lastLogin: timestamp('last_login', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ============ PERMISSIONS TABLE ============
// Granular permission catalog for staff users (Fase 4.1). Owners get every
// key via backfill; staff get explicit grants managed from the admin UI.
export const permissions = pgTable('permissions', {
  key: varchar('key', { length: 50 }).primaryKey(), // 'leads.view', 'leads.edit', ...
  label: varchar('label', { length: 150 }).notNull(),
})

// ============ STAFF_USER_PERMISSIONS TABLE ============
// Join table granting permission keys to admin_users. Composite PK prevents
// duplicate grants; cascades clean up on user or permission deletion.
export const staffUserPermissions = pgTable(
  'staff_user_permissions',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => adminUsers.id, { onDelete: 'cascade' }),
    permissionKey: varchar('permission_key', { length: 50 })
      .notNull()
      .references(() => permissions.key, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.userId, table.permissionKey] })],
)

// ============ HERO_CONFIG TABLE ============
// Singleton row (one record) controls the homepage hero section CMS.
export const heroConfig = pgTable('hero_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  mode: varchar('mode', { length: 20 }).notNull().default('single'),
  headline: text('headline').notNull().default(''),
  subtitle: text('subtitle'),
  eyebrow: varchar('eyebrow', { length: 255 }),
  desktopImageUrl: text('desktop_image_url'),
  mobileImageUrl: text('mobile_image_url'),
  buttons: jsonb('buttons').notNull().default(sql`'[]'::jsonb`),
  slides: jsonb('slides').notNull().default(sql`'[]'::jsonb`),
  autoplayInterval: integer('autoplay_interval').notNull().default(5000),
  overlayOpacity: integer('overlay_opacity').notNull().default(50),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
