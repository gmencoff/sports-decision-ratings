ALTER TABLE "rss_items" ADD COLUMN "transaction_ids" varchar(50)[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "public"."rss_items" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "public"."rss_items" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."rss_item_status";--> statement-breakpoint
CREATE TYPE "public"."rss_item_status" AS ENUM('pending', 'processed', 'failed');--> statement-breakpoint
ALTER TABLE "public"."rss_items" ALTER COLUMN "status" SET DATA TYPE "public"."rss_item_status" USING "status"::"public"."rss_item_status";--> statement-breakpoint
ALTER TABLE "public"."rss_items" ALTER COLUMN "status" SET DEFAULT 'pending';
