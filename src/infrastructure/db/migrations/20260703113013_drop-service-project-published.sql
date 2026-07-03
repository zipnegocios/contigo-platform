DROP INDEX "idx_projects_status";--> statement-breakpoint
CREATE INDEX "idx_projects_status" ON "projects" USING btree ("status");--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "published";--> statement-breakpoint
ALTER TABLE "services" DROP COLUMN "published";