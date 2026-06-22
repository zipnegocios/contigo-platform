-- Custom SQL migration file, put your code below! --

-- Data cleanup, NOT a schema change. Tras confirmar el backfill de la migracion
-- anterior (trashed_at = archived_at), archived_at queda libre para representar
-- el concepto NUEVO de "archive" (distinto de trash). Limpiamos lo que el
-- backfill copio, porque ese estado ya vive en trashed_at.
UPDATE "leads" SET "archived_at" = NULL WHERE "archived_at" IS NOT NULL;