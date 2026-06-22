ALTER TYPE "public"."lead_activity_type" ADD VALUE 'event_scheduled' BEFORE 'document_uploaded';--> statement-breakpoint
ALTER TYPE "public"."lead_activity_type" ADD VALUE 'event_completed' BEFORE 'document_uploaded';--> statement-breakpoint
ALTER TYPE "public"."lead_activity_type" ADD VALUE 'event_cancelled' BEFORE 'document_uploaded';--> statement-breakpoint
ALTER TYPE "public"."lead_event_type" ADD VALUE 'follow_up';