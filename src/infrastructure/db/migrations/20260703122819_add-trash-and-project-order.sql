ALTER TABLE "categories" ADD COLUMN "trashed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "order_index" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "trashed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "trashed_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "idx_categories_trashed_at" ON "categories" USING btree ("trashed_at");--> statement-breakpoint
CREATE INDEX "idx_projects_order" ON "projects" USING btree ("order_index");--> statement-breakpoint
CREATE INDEX "idx_projects_trashed_at" ON "projects" USING btree ("trashed_at");--> statement-breakpoint
CREATE INDEX "idx_services_trashed_at" ON "services" USING btree ("trashed_at");