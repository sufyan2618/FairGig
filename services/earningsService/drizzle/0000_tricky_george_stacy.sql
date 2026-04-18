CREATE TYPE "public"."decision_status" AS ENUM('verified', 'flagged', 'unverifiable');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'pending_review', 'verified', 'flagged', 'unverifiable');--> statement-breakpoint
CREATE TABLE "shift_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worker_id" uuid NOT NULL,
	"platform" varchar(80) NOT NULL,
	"shift_date" date NOT NULL,
	"hours_worked_minutes" integer NOT NULL,
	"gross_earned" integer NOT NULL,
	"platform_deductions" integer NOT NULL,
	"net_received" integer NOT NULL,
	"worker_category" varchar(60),
	"city_zone" varchar(80),
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"verification_note" text,
	"screenshot_url" text,
	"screenshot_storage_path" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_at" timestamp with time zone,
	"verified_by_id" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shift_id" uuid NOT NULL,
	"verifier_id" uuid NOT NULL,
	"decision_status" "decision_status" NOT NULL,
	"note" text,
	"decided_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "verification_decisions" ADD CONSTRAINT "verification_decisions_shift_id_shift_logs_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shift_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_shift_logs_worker_id" ON "shift_logs" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "idx_shift_logs_status" ON "shift_logs" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "idx_shift_logs_shift_date" ON "shift_logs" USING btree ("shift_date");--> statement-breakpoint
CREATE INDEX "idx_shift_logs_category_zone" ON "shift_logs" USING btree ("worker_category","city_zone");--> statement-breakpoint
CREATE INDEX "idx_verification_decisions_shift_id" ON "verification_decisions" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "idx_verification_decisions_verifier_id" ON "verification_decisions" USING btree ("verifier_id");--> statement-breakpoint
CREATE INDEX "idx_verification_decisions_decision_status" ON "verification_decisions" USING btree ("decision_status");