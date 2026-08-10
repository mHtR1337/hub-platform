-- HSpec Hub v2: athletes, calendar spine, flags, registries, audit log
-- CreateEnum
-- CreateTable
CREATE TABLE "athletes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "active_team_id" UUID,
    "user_id" UUID,
    "name" TEXT NOT NULL,
    "date_of_birth" DATE,
    "sex" TEXT NOT NULL DEFAULT '',
    "position" TEXT NOT NULL DEFAULT '',
    "medical_status" TEXT NOT NULL DEFAULT 'available-no-issues',
    "training_status" TEXT NOT NULL DEFAULT 'full-training-competition',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "athletes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "athlete_team_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "athlete_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMPTZ(6),

    CONSTRAINT "athlete_team_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "athlete_groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "athlete_id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "added_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "athlete_groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "athlete_tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "athlete_id" UUID NOT NULL,
    "tag_definition_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "athlete_tags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "status_options" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'gray',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_options_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "status_changes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "athlete_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "old_value" TEXT NOT NULL,
    "new_value" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT 'hub',
    "actor_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_changes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "calendar_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "team_id" UUID,
    "type" TEXT NOT NULL DEFAULT 'training',
    "title" TEXT NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6),
    "location" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "descriptors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "event_participants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "athlete_id" UUID NOT NULL,
    "added_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_participants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "attendance_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "athlete_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'full',
    "note" TEXT NOT NULL DEFAULT '',
    "updated_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "linked_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "app_slug" TEXT NOT NULL,
    "record_type" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "linked_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "flag_definitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "source_app" TEXT NOT NULL DEFAULT 'hub',
    "severity" TEXT NOT NULL DEFAULT 'info',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "show_on_board" BOOLEAN NOT NULL DEFAULT true,
    "show_on_calendar" BOOLEAN NOT NULL DEFAULT true,
    "show_on_card" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flag_definitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "flags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "flag_definition_id" UUID NOT NULL,
    "athlete_id" UUID,
    "event_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'active',
    "message" TEXT NOT NULL DEFAULT '',
    "source_app" TEXT NOT NULL DEFAULT 'hub',
    "snoozed_until" TIMESTAMPTZ(6),
    "resolved_by_id" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "athlete_notes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "athlete_id" UUID NOT NULL,
    "author_id" UUID,
    "body" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'coach',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "athlete_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "actor_id" UUID,
    "source_app" TEXT NOT NULL DEFAULT 'hub',
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL DEFAULT '',
    "old_value" JSONB,
    "new_value" JSONB,
    "reason" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "athletes_user_id_key" ON "athletes"("user_id");
CREATE INDEX "athletes_org_archived_idx" ON "athletes"("organization_id", "archived");
CREATE INDEX "athletes_active_team_idx" ON "athletes"("active_team_id");
CREATE INDEX "athletes_org_training_idx" ON "athletes"("organization_id", "training_status");
CREATE INDEX "athlete_team_history_athlete_idx" ON "athlete_team_history"("athlete_id");
CREATE UNIQUE INDEX "athlete_groups_athlete_group_key" ON "athlete_groups"("athlete_id", "group_id");
CREATE UNIQUE INDEX "athlete_tags_athlete_tag_key" ON "athlete_tags"("athlete_id", "tag_definition_id");
CREATE UNIQUE INDEX "status_options_org_kind_slug_key" ON "status_options"("organization_id", "kind", "slug");
CREATE INDEX "status_changes_athlete_time_idx" ON "status_changes"("athlete_id", "created_at");
CREATE INDEX "calendar_events_org_time_idx" ON "calendar_events"("organization_id", "starts_at");
CREATE INDEX "calendar_events_team_time_idx" ON "calendar_events"("team_id", "starts_at");
CREATE UNIQUE INDEX "event_participants_event_athlete_key" ON "event_participants"("event_id", "athlete_id");
CREATE INDEX "event_participants_athlete_idx" ON "event_participants"("athlete_id");
CREATE UNIQUE INDEX "attendance_event_athlete_key" ON "attendance_records"("event_id", "athlete_id");
CREATE INDEX "attendance_athlete_idx" ON "attendance_records"("athlete_id");
CREATE INDEX "linked_records_event_idx" ON "linked_records"("event_id");
CREATE INDEX "linked_records_app_type_idx" ON "linked_records"("app_slug", "record_type");
CREATE UNIQUE INDEX "flag_definitions_org_slug_key" ON "flag_definitions"("organization_id", "slug");
CREATE INDEX "flags_org_status_idx" ON "flags"("organization_id", "status");
CREATE INDEX "flags_athlete_status_idx" ON "flags"("athlete_id", "status");
CREATE INDEX "athlete_notes_athlete_time_idx" ON "athlete_notes"("athlete_id", "created_at");
CREATE INDEX "audit_logs_org_time_idx" ON "audit_logs"("organization_id", "created_at");
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource_type", "resource_id");

-- AddForeignKey
ALTER TABLE "athletes" ADD CONSTRAINT "athletes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "athletes" ADD CONSTRAINT "athletes_active_team_id_fkey" FOREIGN KEY ("active_team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "athletes" ADD CONSTRAINT "athletes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "athlete_team_history" ADD CONSTRAINT "athlete_team_history_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "athlete_team_history" ADD CONSTRAINT "athlete_team_history_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "athlete_groups" ADD CONSTRAINT "athlete_groups_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "athlete_groups" ADD CONSTRAINT "athlete_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "athlete_tags" ADD CONSTRAINT "athlete_tags_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "athlete_tags" ADD CONSTRAINT "athlete_tags_tag_definition_id_fkey" FOREIGN KEY ("tag_definition_id") REFERENCES "tag_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "status_options" ADD CONSTRAINT "status_options_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "status_changes" ADD CONSTRAINT "status_changes_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "status_changes" ADD CONSTRAINT "status_changes_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "linked_records" ADD CONSTRAINT "linked_records_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "flag_definitions" ADD CONSTRAINT "flag_definitions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "flags" ADD CONSTRAINT "flags_flag_definition_id_fkey" FOREIGN KEY ("flag_definition_id") REFERENCES "flag_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "flags" ADD CONSTRAINT "flags_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "flags" ADD CONSTRAINT "flags_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "flags" ADD CONSTRAINT "flags_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "athlete_notes" ADD CONSTRAINT "athlete_notes_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "athlete_notes" ADD CONSTRAINT "athlete_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
