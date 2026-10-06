# MERN Admin — Code Review & Fixes (2026-10-06)

## Scope

Reviewed the uploaded codebase export (148 files) with focus on:

- DRY / KISS / YAGNI (softly, without unnecessary abstraction)
- SOLID, SoC, SRP, modularity and reusability
- RBAC correctness and multi-role behavior
- authentication, authorization, CSRF, validation and error handling
- MongoDB migrations, seeders and indexes
- notification feature
- frontend state/UI consistency
- Git/version-control hygiene
- maintainability, testability and performance

## Fixes applied

### 1. Database name mismatch — FIXED

`backend/migrate-mongo-config.js` and `backend/scripts/resetDatabase.js` used `mern_admin1` while the seeders used `mern_admin`.

**Result:** migrations/reset and seeders now target the same default database: `mern_admin`.

### 2. `db:reset` did not run the sample seeder — FIXED

The reset script passed two filenames to one Node process. `databaseSeeder.js` ignored the second filename, so `sampleDataSeeder.js` never executed.

**Result:** reset now runs:

1. baseline migrations
2. main database seeder
3. sample-data seeder

### 3. Admin wildcard permission could disappear — FIXED

`getEffectivePermissions()` expanded `*` into catalog permissions and then removed `*`.

That weakened the intended full-access semantics: backend helpers and future/custom permissions could no longer reliably recognize the admin wildcard.

**Result:** `*` is retained while catalog permissions are also expanded.

### 4. Role rename could break role inheritance — FIXED

When a role was renamed, users were updated but child roles still referenced the old `parentRole` name.

**Result:** renaming a role now also updates `Role.parentRole` references from the old name to the new name.

### 5. Notification mark-as-read was not idempotent — FIXED

The endpoint only matched unread notifications. Repeating the same request returned 404.

**Result:** `PATCH /api/notifications/:id/read` is now idempotent and safely returns the notification even when it is already read.

### 6. Dead frontend resize effect — REMOVED

`AdminLayout.jsx` contained a resize listener whose callback performed no state change or action.

**Result:** removed unnecessary code/listener.

### 7. Visible mojibake in UI — FIXED

Several UI strings contained broken encoding such as `Ã‚Â·`, `â—`, and `Ã¢â‚¬Â¦`.

**Result:** affected frontend strings were normalized to proper Unicode punctuation.

### 8. Git documentation/backup hygiene — FIXED

The root `.gitignore` incorrectly ignored `README.md` and `backend/README.md`, while `db_backup/` was not ignored.

**Result:** documentation can be tracked; local database backups are ignored.

## Static validation performed

- Backend `node --check` across all backend JavaScript files: **PASS**
- Relative import/reference resolution: **PASS — 0 missing relative imports**
- Route/controller reference sanity check: **PASS**
- Frontend lint/build: **NOT EXECUTED** because the uploaded export did not contain a complete installed dependency tree; `oxlint` binary was unavailable in the mounted frontend dependencies.
- MongoDB integration tests: **NOT EXECUTED** because no live MongoDB instance was provided.

## Important observations not changed because they are not clear bugs / would add unnecessary complexity

- Notification types such as role/permission/password notifications exist as a catalog, but only `USER_CREATED` is wired to a real event. This is intentionally kept simple until those events are required.
- Notification polling remains 30 seconds; WebSocket/SSE would be unnecessary complexity at this stage.
- Existing service-layer architecture is retained rather than introducing repositories everywhere. Mongo/Mongoose repositories would add files without a current benefit.
- Client-side permission checks remain UX only; backend middleware remains the security boundary.
- Existing client-side pagination for small catalogs is retained where the API already returns the full catalog.
- The existing admin-operation lock is retained because concurrent last-admin mutations are a real consistency concern.

## Recommended real-environment test order

1. `cd backend`
2. `npm ci`
3. `npm run db:migrate`
4. `npm run seed`
5. `npm run seed:sample`
6. `npm test`
7. `cd ../frontend`
8. `npm ci`
9. `npm run lint`
10. `npm run build`
11. Start MongoDB + backend + frontend and execute the RBAC/notification/auth test matrix.

## Highest-priority manual cases

- admin login/logout/session expiry
- non-admin access denial
- multi-role user effective permissions
- role inheritance including 2+ levels
- role rename while child roles exist
- role permission immediate update
- user allow/deny override
- admin wildcard access
- last active admin cannot be removed/demoted/deactivated
- edit user with blank password
- self role/status/permission restrictions
- duplicate email
- CSRF failure/retry
- forgot/reset/change password
- email verification
- notification ownership isolation
- notification read/read-all/delete
- maintenance mode
- migration + seed + 1000 sample users
