CREATE TYPE "public"."lead_activity_type" AS ENUM('stage_change', 'note', 'call_scheduled', 'call_completed', 'call_cancelled', 'visit_scheduled', 'visit_completed', 'visit_cancelled', 'document_uploaded', 'document_sent', 'email_sent', 'quote_status_changed');--> statement-breakpoint
CREATE TYPE "public"."lead_document_category" AS ENUM('reference_photo', 'site_photo', 'quote_pdf', 'contract', 'other');--> statement-breakpoint
CREATE TYPE "public"."lead_document_direction" AS ENUM('client_upload', 'admin_sent', 'internal');--> statement-breakpoint
CREATE TYPE "public"."lead_event_status" AS ENUM('scheduled', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."lead_event_type" AS ENUM('call', 'site_visit', 'meeting');--> statement-breakpoint
CREATE TABLE "lead_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"type" "lead_activity_type" NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"file_key" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"mime_type" varchar(100),
	"direction" "lead_document_direction" NOT NULL,
	"category" "lead_document_category" DEFAULT 'other' NOT NULL,
	"source_media_id" uuid,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"type" "lead_event_type" NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer DEFAULT 30 NOT NULL,
	"status" "lead_event_status" DEFAULT 'scheduled' NOT NULL,
	"location" text,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_documents" ADD CONSTRAINT "lead_documents_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_documents" ADD CONSTRAINT "lead_documents_uploaded_by_admin_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_events" ADD CONSTRAINT "lead_events_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_events" ADD CONSTRAINT "lead_events_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_lead_activities_lead_id" ON "lead_activities" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "idx_lead_activities_created_at" ON "lead_activities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_lead_activities_type" ON "lead_activities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_lead_documents_lead_id" ON "lead_documents" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "idx_lead_documents_direction" ON "lead_documents" USING btree ("direction");--> statement-breakpoint
CREATE INDEX "idx_lead_events_lead_id" ON "lead_events" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "idx_lead_events_scheduled_at" ON "lead_events" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_lead_events_status" ON "lead_events" USING btree ("status");
