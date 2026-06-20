# Hub — Mobile & Organization API

Base path: `/api/v1`. All routes require a valid **Clerk session** (same as web).

## Authentication

Send the Clerk session cookie from the browser, or use Clerk's native SDK session token on iOS/Android. Unauthenticated requests return `401`.

## Endpoints

### `GET /api/v1/me`

Current user profile and primary organization membership.

### `GET /api/v1/org`

Organization details: teams, members, tag definitions, active plan, seat usage (`usedCoaches` / `maxCoaches`, `usedAthletes` / `maxAthletes`), and available plan templates.

### `POST /api/v1/org`

Create a group within a team.

```json
{ "teamId": "uuid", "name": "Elite squad" }
```

### `GET /api/v1/org/teams/:teamId`

Team roster (`team_members`) and groups with members.

### `POST /api/v1/org/teams/:teamId/invite`

Invite an athlete by email. Requires `manage_roster` privilege.

```json
{ "email": "athlete@example.com" }
```

Returns `402` when athlete seat limit is reached.

### `GET /api/v1/org/tags`

List tag definitions for the organization (`sport`, `position`, `descriptive`).

### `POST /api/v1/org/tags`

Assign a tag value to a member.

```json
{ "userId": "uuid", "tagSlug": "position", "value": "Winger" }
```

## Data model summary

- **organization_members** — admin, coach, staff, athlete; staff carries JSON privileges
- **team_members** — coaches and athletes on a team (many-to-many)
- **groups** / **group_members** — sub-groups within a team
- **tag_definitions** / **member_tags** — typed tags on people
- **plan_templates** / **organization_plans** — seat limits per org

Legacy **coach_athletes** invite flow remains for backward compatibility; accepting an invite creates org + team membership rows.
