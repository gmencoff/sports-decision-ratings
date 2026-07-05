CREATE TABLE "feedback" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"page_url" varchar(500),
	"user_agent" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
