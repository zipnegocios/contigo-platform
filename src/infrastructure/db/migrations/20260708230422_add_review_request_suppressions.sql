CREATE TABLE "review_request_suppressions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"suppressed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_request_suppressions_email_unique" UNIQUE("email")
);
