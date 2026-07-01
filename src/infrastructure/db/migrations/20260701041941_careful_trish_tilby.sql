DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media_metadata' AND column_name='optimized') THEN
    ALTER TABLE "media_metadata" ADD COLUMN "optimized" boolean DEFAULT false NOT NULL;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='page_blocks') THEN
    ALTER TABLE "services" ADD COLUMN "page_blocks" jsonb;
  END IF;
END $$;
