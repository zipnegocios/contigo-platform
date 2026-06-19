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
} from 'drizzle-orm/pg-core'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import type { GalleryItem } from '@/types/media'

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

export const leadActivityTypeEnum = pgEnum('lead_activity_type', [
  'stage_change',
  'note',
  'call_scheduled',
  'call_completed',
  'call_cancelled',
  'visit_scheduled',
  'visit_completed',
  'visit_cancelled',
  'document_uploaded',
  'document_sent',
  'email_sent',
  'quote_status_changed',
])

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
    isActive: boolean('is_active').notNull().default(true),
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
  ],
)

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
    orderIndex: integer('order_index').notNull().default(0),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    published: boolean('published').notNull().default(true),
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
    stage: leadStageEnum('stage').notNull().default('prospect'),
    adminNotes: text('admin_notes'),
    estimatedValue: integer('estimated_value'), // cents
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_leads_stage').on(table.stage),
    index('idx_leads_quote_id').on(table.quoteId),
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
  isActive: boolean('is_active').notNull().default(true),
  lastLogin: timestamp('last_login', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
