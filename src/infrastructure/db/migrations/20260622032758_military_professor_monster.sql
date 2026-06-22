CREATE TABLE "lead_contact_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(50) NOT NULL,
	"label" varchar(100) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lead_contact_roles_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "lead_contacts" ADD COLUMN "role_id" uuid;--> statement-breakpoint
ALTER TABLE "lead_contacts" ADD CONSTRAINT "lead_contacts_role_id_lead_contact_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."lead_contact_roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_lead_contacts_role_id" ON "lead_contacts" USING btree ("role_id");