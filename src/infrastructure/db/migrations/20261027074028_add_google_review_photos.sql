CREATE TABLE "google_review_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_media_name" varchar(255) NOT NULL,
	"review_id" uuid,
	"match_source" varchar(10) DEFAULT 'auto' NOT NULL,
	"google_url" text NOT NULL,
	"thumbnail_url" text,
	"width" integer,
	"height" integer,
	"attribution_name" varchar(255),
	"attribution_profile_url" text,
	"media_created_at" timestamp with time zone NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "google_review_photos_google_media_name_unique" UNIQUE("google_media_name")
);
--> statement-breakpoint
ALTER TABLE "google_review_photos" ADD CONSTRAINT "google_review_photos_review_id_google_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."google_reviews"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_google_review_photos_review_id" ON "google_review_photos" USING btree ("review_id");