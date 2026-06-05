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
  customType,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// Define vector type manually to avoid pgvector export issues
const vector = customType<{ data: number[] }>({
  dataType() {
    return 'vector(1536)'
  },
})

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
    descriptionVector: vector('description_vector', { dimensions: 1536 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_quotes_status').on(table.status),
    index('idx_quotes_email').on(table.email),
    index('idx_quotes_tracking_token').on(table.trackingToken),
    index('idx_quotes_created_at').on(table.createdAt),
    index('idx_quotes_vector_hnsw').using('hnsw', table.descriptionVector),
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
    description: text('description').notNull(),
    location: varchar('location', { length: 255 }).notNull(),
    completedDate: timestamp('completed_date', { withTimezone: true }).notNull(),
    featured: boolean('featured').notNull().default(false),
    published: boolean('published').notNull().default(false),
    coverImageUrl: text('cover_image_url').notNull(),
    galleryUrls: jsonb('gallery_urls').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    descriptionVector: vector('description_vector', { dimensions: 1536 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_projects_slug').on(table.slug),
    index('idx_projects_status').on(table.published),
    index('idx_projects_featured').on(table.featured),
    index('idx_projects_created_at').on(table.createdAt),
    index('idx_projects_vector_hnsw').using('hnsw', table.descriptionVector),
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
    orderIndex: integer('order_index').notNull().default(0),
    published: boolean('published').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_services_order').on(table.orderIndex)],
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
