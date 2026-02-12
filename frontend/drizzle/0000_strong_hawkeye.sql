CREATE TYPE "public"."transaction_type" AS ENUM('trade', 'signing', 'draft', 'release', 'extension', 'hire', 'fire');--> statement-breakpoint
CREATE TYPE "public"."sentiment" AS ENUM('good', 'bad', 'unsure');--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"type" "transaction_type" NOT NULL,
	"team_ids" varchar(10)[] NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"transaction_id" varchar(50) NOT NULL,
	"team_id" varchar(10) NOT NULL,
	"voter_id" varchar(64) NOT NULL,
	"sentiment" "sentiment" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "votes_transaction_team_voter_unique" UNIQUE("transaction_id","team_id","voter_id")
);
--> statement-breakpoint
CREATE TABLE "vote_summaries" (
	"transaction_id" varchar(50) NOT NULL,
	"team_id" varchar(10) NOT NULL,
	"good_count" integer DEFAULT 0 NOT NULL,
	"bad_count" integer DEFAULT 0 NOT NULL,
	"unsure_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "vote_summaries_transaction_id_team_id_pk" PRIMARY KEY("transaction_id","team_id")
);
--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_summaries" ADD CONSTRAINT "vote_summaries_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transactions_timestamp_idx" ON "transactions" USING btree ("timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "votes_transaction_id_idx" ON "votes" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "votes_voter_id_idx" ON "votes" USING btree ("voter_id");