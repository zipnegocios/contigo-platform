-- Backfill: populate leads.stage_id from the legacy stage enum value,
-- matched by key, for every existing lead. The old `stage` enum column
-- itself is left in place — dropping it is deferred to a separate, later
-- migration, executed only after confirming in production that everything
-- reads from stage_id (see plan's "no combinar add+drop" rule).
UPDATE leads
SET stage_id = pipeline_stages.id
FROM pipeline_stages
WHERE leads.stage::text = pipeline_stages.key
  AND leads.stage_id IS NULL;
--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "stage_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_stage_id_pipeline_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."pipeline_stages"("id") ON DELETE no action ON UPDATE no action;