CREATE TYPE "public"."lead_message_author" AS ENUM('client', 'staff');--> statement-breakpoint
CREATE TABLE "lead_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"author_type" "lead_message_author" NOT NULL,
	"author_id" uuid,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "lead_messages" ADD CONSTRAINT "lead_messages_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_messages" ADD CONSTRAINT "lead_messages_author_id_admin_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_lead_messages_lead_id" ON "lead_messages" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "idx_lead_messages_unread" ON "lead_messages" USING btree ("lead_id","author_type","read_at");