ALTER TABLE "payment_methods" ADD COLUMN "account_holder_name" varchar(100);--> statement-breakpoint
ALTER TABLE "payment_methods" ADD COLUMN "bank_name" varchar(100);--> statement-breakpoint
ALTER TABLE "payment_methods" ADD COLUMN "account_number" varchar(50);