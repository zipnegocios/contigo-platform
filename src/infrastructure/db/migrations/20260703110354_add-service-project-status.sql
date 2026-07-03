DROP TYPE "public"."project_status";--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('draft', 'active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."service_status" AS ENUM('draft', 'active', 'inactive');--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "status" "project_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "status" "service_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
UPDATE services SET status = 'inactive' WHERE published = false;--> statement-breakpoint
UPDATE projects SET status = 'active' WHERE published = true;
