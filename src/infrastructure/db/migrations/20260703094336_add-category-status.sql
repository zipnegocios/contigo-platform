CREATE TYPE "public"."category_status" AS ENUM('draft', 'active', 'inactive');--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "status" "category_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_categories_status" ON "categories" USING btree ("status");--> statement-breakpoint
UPDATE categories SET status = 'inactive' WHERE is_active = false;