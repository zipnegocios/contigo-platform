ALTER TABLE "leads" ADD COLUMN "trashed_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "idx_leads_trashed_at" ON "leads" USING btree ("trashed_at");--> statement-breakpoint

-- Backfill: el mecanismo actual de "archivedAt" en la practica significa trash
-- (lo confirma la UI: el boton se llama "Move to trash"). Antes de reinterpretar
-- archivedAt como un concepto nuevo, preservamos el estado actual copiandolo a
-- trashed_at para cualquier lead ya "archivado" (== trashed) hoy.
UPDATE "leads" SET "trashed_at" = "archived_at" WHERE "archived_at" IS NOT NULL;