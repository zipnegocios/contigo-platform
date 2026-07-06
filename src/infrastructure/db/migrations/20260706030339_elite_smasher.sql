ALTER TABLE "categories" ADD COLUMN "meta_title" varchar(60);--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "meta_description" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "meta_keywords" jsonb;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "meta_title" varchar(60);--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "meta_description" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "meta_keywords" jsonb;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "no_index" boolean DEFAULT false NOT NULL;