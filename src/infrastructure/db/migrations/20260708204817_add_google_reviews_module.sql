CREATE TYPE "public"."review_request_status" AS ENUM('scheduled', 'sent', 'opened', 'clicked', 'reviewed_inferred', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."review_sentiment" AS ENUM('positive', 'neutral', 'negative');--> statement-breakpoint
CREATE TYPE "public"."review_sync_status" AS ENUM('success', 'partial', 'failed');--> statement-breakpoint
CREATE TYPE "public"."review_sync_trigger" AS ENUM('manual', 'scheduled');--> statement-breakpoint
CREATE TABLE "google_review_tags" (
	"review_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "google_review_tags_review_id_tag_id_pk" PRIMARY KEY("review_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "google_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_review_id" varchar(255) NOT NULL,
	"location_id" varchar(100) NOT NULL,
	"reviewer_name" varchar(255) NOT NULL,
	"reviewer_avatar_url" text,
	"reviewer_profile_url" text,
	"rating" integer NOT NULL,
	"comment" text,
	"review_created_at" timestamp with time zone NOT NULL,
	"review_updated_at" timestamp with time zone NOT NULL,
	"language" varchar(10),
	"owner_reply" text,
	"owner_reply_at" timestamp with time zone,
	"is_visible" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"internal_notes" text,
	"ai_summary" text,
	"ai_sentiment" "review_sentiment",
	"ai_categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"spam_score" numeric(4, 3),
	"deleted_on_google_at" timestamp with time zone,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "google_reviews_google_review_id_unique" UNIQUE("google_review_id")
);
--> statement-breakpoint
CREATE TABLE "review_request_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"body_html" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"contact_email" varchar(255) NOT NULL,
	"contact_name" varchar(255) NOT NULL,
	"status" "review_request_status" DEFAULT 'scheduled' NOT NULL,
	"template_id" uuid NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"clicked_at" timestamp with time zone,
	"reminder_count" integer DEFAULT 0 NOT NULL,
	"next_reminder_at" timestamp with time zone,
	"matched_review_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sync_frequency_minutes" integer DEFAULT 15 NOT NULL,
	"request_delay_days" integer DEFAULT 3 NOT NULL,
	"max_reminders_per_request" integer DEFAULT 2 NOT NULL,
	"reminder_interval_days" integer DEFAULT 7 NOT NULL,
	"min_stars_public" integer DEFAULT 4 NOT NULL,
	"default_display_mode" varchar(20) DEFAULT 'carousel' NOT NULL,
	"website_visibility_flags" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"automation_rules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_sync_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trigger" "review_sync_trigger" NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" "review_sync_status",
	"new_count" integer DEFAULT 0 NOT NULL,
	"updated_count" integer DEFAULT 0 NOT NULL,
	"deleted_count" integer DEFAULT 0 NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "review_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(7) DEFAULT '#E2C063' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "google_review_tags" ADD CONSTRAINT "google_review_tags_review_id_google_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."google_reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_review_tags" ADD CONSTRAINT "google_review_tags_tag_id_review_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."review_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_template_id_review_request_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."review_request_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_matched_review_id_google_reviews_id_fk" FOREIGN KEY ("matched_review_id") REFERENCES "public"."google_reviews"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_google_reviews_rating" ON "google_reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "idx_google_reviews_is_visible" ON "google_reviews" USING btree ("is_visible");--> statement-breakpoint
CREATE INDEX "idx_google_reviews_review_created_at" ON "google_reviews" USING btree ("review_created_at");--> statement-breakpoint
CREATE INDEX "idx_review_requests_lead_id" ON "review_requests" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "idx_review_requests_status" ON "review_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_review_requests_next_reminder_at" ON "review_requests" USING btree ("next_reminder_at");