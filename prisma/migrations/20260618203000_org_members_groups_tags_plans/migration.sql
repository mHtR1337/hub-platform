-- Plan templates (seat-based packages)
CREATE TABLE "plan_templates" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "max_coaches" INTEGER NOT NULL,
    "max_athletes" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "plan_templates_pkey" PRIMARY KEY ("slug")
);

INSERT INTO "plan_templates" ("slug", "name", "max_coaches", "max_athletes", "sort_order") VALUES
    ('starter', 'Starter', 1, 10, 1),
    ('growth', 'Growth', 2, 20, 2),
    ('pro', 'Pro', 3, 30, 3),
    ('elite', 'Elite', 5, 50, 4);

-- Organization members (admin, coach, staff, athlete)
CREATE TABLE "organization_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "privileges" JSONB NOT NULL DEFAULT '[]',
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "org_members_org_user_key" ON "organization_members"("organization_id", "user_id");
CREATE INDEX "org_members_user_id_idx" ON "organization_members"("user_id");
CREATE INDEX "org_members_org_role_idx" ON "organization_members"("organization_id", "role");

ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: founding coach becomes org admin
INSERT INTO "organization_members" ("organization_id", "user_id", "role", "privileges", "joined_at")
SELECT o."id", o."coach_id", 'admin', '["manage_org","manage_roster","manage_billing","manage_tags","view_all"]'::jsonb, o."created_at"
FROM "organizations" o
ON CONFLICT DO NOTHING;

-- Team members
CREATE TABLE "team_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "team_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "team_members_team_user_key" ON "team_members"("team_id", "user_id");
CREATE INDEX "team_members_org_id_idx" ON "team_members"("organization_id");
CREATE INDEX "team_members_user_id_idx" ON "team_members"("user_id");

ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_fkey"
    FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill coaches on their teams
INSERT INTO "team_members" ("team_id", "organization_id", "user_id", "role", "joined_at")
SELECT t."id", t."organization_id", o."coach_id", 'coach', t."created_at"
FROM "teams" t
JOIN "organizations" o ON o."id" = t."organization_id"
ON CONFLICT DO NOTHING;

-- Backfill active athletes from coach_athletes
INSERT INTO "organization_members" ("organization_id", "user_id", "role", "privileges", "joined_at")
SELECT DISTINCT o."id", ca."athlete_id", 'athlete', '[]'::jsonb, COALESCE(ca."accepted_at", ca."invited_at")
FROM "coach_athletes" ca
JOIN "organizations" o ON o."coach_id" = ca."coach_id"
WHERE ca."athlete_id" IS NOT NULL AND ca."status" = 'active'
ON CONFLICT DO NOTHING;

INSERT INTO "team_members" ("team_id", "organization_id", "user_id", "role", "joined_at")
SELECT ca."team_id", t."organization_id", ca."athlete_id", 'athlete', COALESCE(ca."accepted_at", ca."invited_at")
FROM "coach_athletes" ca
JOIN "teams" t ON t."id" = ca."team_id"
WHERE ca."athlete_id" IS NOT NULL AND ca."status" = 'active' AND ca."team_id" IS NOT NULL
ON CONFLICT DO NOTHING;

-- Groups within teams
CREATE TABLE "groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "team_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "groups_team_id_idx" ON "groups"("team_id");
CREATE INDEX "groups_org_id_idx" ON "groups"("organization_id");

ALTER TABLE "groups" ADD CONSTRAINT "groups_team_id_fkey"
    FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "group_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "group_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "added_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "group_members_group_user_key" ON "group_members"("group_id", "user_id");
CREATE INDEX "group_members_user_id_idx" ON "group_members"("user_id");

ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_fkey"
    FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Typed tags
CREATE TABLE "tag_definitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tag_definitions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tag_defs_org_slug_key" ON "tag_definitions"("organization_id", "slug");

ALTER TABLE "tag_definitions" ADD CONSTRAINT "tag_definitions_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "member_tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tag_definition_id" UUID NOT NULL,
    "value" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "member_tags_user_tag_key" ON "member_tags"("user_id", "tag_definition_id");
CREATE INDEX "member_tags_org_id_idx" ON "member_tags"("organization_id");

ALTER TABLE "member_tags" ADD CONSTRAINT "member_tags_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "member_tags" ADD CONSTRAINT "member_tags_tag_definition_id_fkey"
    FOREIGN KEY ("tag_definition_id") REFERENCES "tag_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Default org plan (starter) for existing orgs
CREATE TABLE "organization_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "plan_slug" TEXT NOT NULL,
    "max_coaches" INTEGER,
    "max_athletes" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organization_plans_organization_id_key" ON "organization_plans"("organization_id");

ALTER TABLE "organization_plans" ADD CONSTRAINT "organization_plans_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_plans" ADD CONSTRAINT "organization_plans_plan_slug_fkey"
    FOREIGN KEY ("plan_slug") REFERENCES "plan_templates"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "organization_plans" ("organization_id", "plan_slug", "status")
SELECT o."id", 'starter', 'active'
FROM "organizations" o
WHERE NOT EXISTS (
    SELECT 1 FROM "organization_plans" p WHERE p."organization_id" = o."id"
);

-- Default tag definitions for existing orgs
INSERT INTO "tag_definitions" ("organization_id", "slug", "label", "category")
SELECT o."id", 'sport', 'Sport', 'sport'
FROM "organizations" o
ON CONFLICT DO NOTHING;

INSERT INTO "tag_definitions" ("organization_id", "slug", "label", "category")
SELECT o."id", 'position', 'Position', 'position'
FROM "organizations" o
ON CONFLICT DO NOTHING;

INSERT INTO "tag_definitions" ("organization_id", "slug", "label", "category")
SELECT o."id", 'notes', 'Notes', 'descriptive'
FROM "organizations" o
ON CONFLICT DO NOTHING;
