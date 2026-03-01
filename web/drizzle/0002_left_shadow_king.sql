CREATE TYPE "public"."rss_item_status" AS ENUM('pending', 'processed', 'no_transactions', 'failed');--> statement-breakpoint
CREATE TABLE "rss_items" (
	"guid" varchar(500) PRIMARY KEY NOT NULL,
	"source" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"link" varchar(1000) NOT NULL,
	"pub_date" timestamp with time zone NOT NULL,
	"status" "rss_item_status" DEFAULT 'pending' NOT NULL,
	"processed_at" timestamp with time zone,
	"error" text
);
--> statement-breakpoint
CREATE INDEX "rss_items_status_idx" ON "rss_items" USING btree ("status");