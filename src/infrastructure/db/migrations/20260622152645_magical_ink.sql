CREATE TABLE "permissions" (
	"key" varchar(50) PRIMARY KEY NOT NULL,
	"label" varchar(150) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_user_permissions" (
	"user_id" uuid NOT NULL,
	"permission_key" varchar(50) NOT NULL,
	CONSTRAINT "staff_user_permissions_user_id_permission_key_pk" PRIMARY KEY("user_id","permission_key")
);
--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "title" varchar(100);--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "staff_user_permissions" ADD CONSTRAINT "staff_user_permissions_user_id_admin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_user_permissions" ADD CONSTRAINT "staff_user_permissions_permission_key_permissions_key_fk" FOREIGN KEY ("permission_key") REFERENCES "public"."permissions"("key") ON DELETE cascade ON UPDATE no action;