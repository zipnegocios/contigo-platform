-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."admin_role" AS ENUM('owner', 'staff');--> statement-breakpoint
CREATE TYPE "public"."lead_stage" AS ENUM('prospect', 'contacted', 'quoted', 'won', 'lost');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('new', 'contacted', 'in_progress', 'converted', 'closed');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" "admin_role" DEFAULT 'staff' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"stage" "lead_stage" DEFAULT 'prospect' NOT NULL,
	"admin_notes" text,
	"estimated_value" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"short_description" text NOT NULL,
	"full_description" text NOT NULL,
	"image_url" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"poster_url" text,
	"gallery_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"category_id" uuid,
	CONSTRAINT "services_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"location" varchar(255) NOT NULL,
	"completed_date" timestamp with time zone NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"cover_image_url" text NOT NULL,
	"gallery_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"description_vector" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"cover_poster_url" text,
	"category_id" uuid,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"service" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"status" "quote_status" DEFAULT 'new' NOT NULL,
	"tracking_token" varchar(255) NOT NULL,
	"description_vector" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"attachment_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "quotes_tracking_token_unique" UNIQUE("tracking_token")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"parent_id" uuid,
	"type" varchar(20) DEFAULT 'project' NOT NULL,
	"description" text,
	"icon" varchar(100),
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(7) DEFAULT '#E2C063' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_tags_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "media_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"folder_id" uuid,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"width" integer,
	"height" integer,
	"duration" integer,
	"format" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_metadata_key_key" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_folders" ADD CONSTRAINT "media_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."media_folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_metadata" ADD CONSTRAINT "media_metadata_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "public"."media_folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_leads_quote_id" ON "leads" USING btree ("quote_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_leads_stage" ON "leads" USING btree ("stage" enum_ops);--> statement-breakpoint
CREATE INDEX "idx_services_category_id" ON "services" USING btree ("category_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_services_order" ON "services" USING btree ("order_index" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_projects_category_id" ON "projects" USING btree ("category_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_projects_created_at" ON "projects" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_projects_featured" ON "projects" USING btree ("featured" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_projects_slug" ON "projects" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE INDEX "idx_projects_status" ON "projects" USING btree ("published" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_quotes_created_at" ON "quotes" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_quotes_email" ON "quotes" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "idx_quotes_status" ON "quotes" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "idx_quotes_tracking_token" ON "quotes" USING btree ("tracking_token" text_ops);--> statement-breakpoint
CREATE INDEX "idx_categories_is_system" ON "categories" USING btree ("is_system" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_categories_order" ON "categories" USING btree ("order_index" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_categories_parent_id" ON "categories" USING btree ("parent_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_categories_slug" ON "categories" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_categories_slug_type_parent" ON "categories" USING btree (slug text_ops,type uuid_ops,COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uui text_ops);--> statement-breakpoint
CREATE INDEX "idx_categories_type" ON "categories" USING btree ("type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_media_metadata_folder" ON "media_metadata" USING btree ("folder_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_media_metadata_key" ON "media_metadata" USING btree ("key" text_ops);
*/