CREATE TABLE "hero_config_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" varchar(120) DEFAULT '' NOT NULL,
	"snapshot" jsonb NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "hero_config_versions_created_at_idx" ON "hero_config_versions" USING btree ("created_at");