CREATE TABLE IF NOT EXISTS "slaughter_schedules" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "branch_id" bigint NOT NULL REFERENCES "branches"("id"),
  "scheduled_date" date NOT NULL,
  "location_name" varchar(255) NOT NULL,
  "location_lat" numeric(10, 8),
  "location_lng" numeric(11, 8),
  "notes" text,
  "status" varchar(50) DEFAULT 'PLANNED',
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "slaughter_schedules_branch_date_location_uniq"
  ON "slaughter_schedules" ("branch_id", "scheduled_date", "location_name");
CREATE INDEX IF NOT EXISTS "idx_slaughter_schedules_branch"
  ON "slaughter_schedules" ("branch_id");
CREATE INDEX IF NOT EXISTS "idx_slaughter_schedules_date"
  ON "slaughter_schedules" ("scheduled_date");

ALTER TABLE "order_items"
  ADD COLUMN IF NOT EXISTS "slaughter_schedule_id" bigint
  REFERENCES "slaughter_schedules"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "idx_order_items_slaughter_schedule"
  ON "order_items" ("slaughter_schedule_id");
