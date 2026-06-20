CREATE TYPE "public"."lead_contact_role" AS ENUM('owner', 'site_manager', 'spouse', 'other');--> statement-breakpoint
CREATE TABLE "lead_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(255),
	"role" "lead_contact_role",
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "lead_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "lead_documents" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lead_events" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "lead_events" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lead_contacts" ADD CONSTRAINT "lead_contacts_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_lead_contacts_lead_id" ON "lead_contacts" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "idx_lead_contacts_archived_at" ON "lead_contacts" USING btree ("archived_at");--> statement-breakpoint
CREATE INDEX "idx_lead_notes_lead_id" ON "lead_notes" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "idx_lead_notes_archived_at" ON "lead_notes" USING btree ("archived_at");--> statement-breakpoint
CREATE INDEX "idx_lead_documents_archived_at" ON "lead_documents" USING btree ("archived_at");--> statement-breakpoint
CREATE INDEX "idx_lead_events_archived_at" ON "lead_events" USING btree ("archived_at");--> statement-breakpoint
CREATE INDEX "idx_leads_archived_at" ON "leads" USING btree ("archived_at");