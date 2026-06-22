CREATE TABLE "pipeline_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(50) NOT NULL,
	"label" varchar(100) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"color" varchar(7) DEFAULT '#E2C063' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"terminal_kind" varchar(10),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pipeline_stages_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "stage_id" uuid;--> statement-breakpoint
CREATE INDEX "idx_leads_stage_id" ON "leads" USING btree ("stage_id");--> statement-breakpoint

-- Seed: the 5 stages that previously existed as fixed values of the
-- lead_stage Postgres enum, now as rows in pipeline_stages so admins can
-- rename/reorder/create stages from the Kanban UI later. Keys match the
-- existing enum values exactly so the next migration can backfill
-- leads.stage_id by key. Marked isDefault to distinguish "built-in" stages
-- from user-created ones later if needed. terminalKind flags the two
-- stages that represent a closed deal (won/lost) for reporting/automation.
INSERT INTO pipeline_stages (id, key, label, position, color, is_default, terminal_kind)
VALUES
  (gen_random_uuid(), 'prospect', 'Prospect', 0, '#E2C063', true, NULL),
  (gen_random_uuid(), 'contacted', 'Contacted', 1, '#E2C063', true, NULL),
  (gen_random_uuid(), 'quoted', 'Quoted', 2, '#E2C063', true, NULL),
  (gen_random_uuid(), 'won', 'Won', 3, '#E2C063', true, 'won'),
  (gen_random_uuid(), 'lost', 'Lost', 4, '#E2C063', true, 'lost')
ON CONFLICT (key) DO NOTHING;