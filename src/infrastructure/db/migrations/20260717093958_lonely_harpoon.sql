CREATE TABLE "project_slug_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"old_slug" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_slug_history" ADD CONSTRAINT "project_slug_history_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_project_slug_history_old_slug" ON "project_slug_history" USING btree ("old_slug");--> statement-breakpoint
CREATE INDEX "idx_project_slug_history_project_id" ON "project_slug_history" USING btree ("project_id");