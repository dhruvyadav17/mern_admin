# Codebase Review Changes — 2026-10-06

## Backend

### `backend/src/config/db.js`
- Application MongoDB connection now explicitly uses `MONGO_DB_NAME` with `mern_admin` fallback.
- Logs the selected database name after connection.

### `backend/src/services/roleService.js`
- Added reusable role lookup.
- Added recursive effective-role-permission calculation for parent-role security checks.

### `backend/src/controllers/roleController.js`
- Role creation/update now verifies that the actor can grant every direct permission being assigned.
- Parent-role inheritance is included in that grant check, preventing escalation through a powerful parent role.
- Normal metadata-only role updates do not require re-grant validation.

### `backend/src/utils/accessPolicy.js`
- Assigning a custom role to a user now checks the role's effective permissions against the actor's permissions.
- Protected system `user` role remains assignable as the baseline role.
- Protected system roles other than `user` still require `users.role.assign.system`.

### `backend/src/services/permissionService.js`
- Permission matrix can no longer modify any system role.
- Previously only `admin` was protected.

### `backend/src/middleware/maintenanceMiddleware.js`
- Always-allowed endpoints are bypassed before the maintenance setting is queried.
- This keeps `/api/health` usable even if settings/database access is unavailable.

### `backend/src/controllers/authController.js`
- Changing a password now invalidates outstanding password-reset tokens for that user.

### `backend/src/services/passwordResetService.js`
- Added reusable `invalidateForUser()` helper.

### `backend/src/models/Notification.js`
- Removed redundant single-field indexes on `recipient` and `isRead`.
- Compound notification index remains the primary list-query index; TTL index remains unchanged.

## Frontend

### `frontend/src/pages/admin/Users.jsx`
- `/admin/users?edit=<id>` now loads the requested user and opens the Edit User modal automatically.
- This also works when the user is not on the current pagination page.

### `frontend/src/pages/admin/UserDetail.jsx`
- "Manage Permissions" is now hidden unless the current user has `user-permissions.view`.

### `frontend/src/pages/admin/RolePermissions.jsx`
- Inherited permissions are calculated recursively through the complete parent chain.
- System roles are consistently read-only in the matrix.
- Permission/group changes are serialized at the UI level by disabling other toggles while a save is in progress, avoiding stale concurrent writes.

## Validation

- Backend JavaScript syntax check: PASS for all `backend/src/**/*.js` files.
- Existing automated tests before this patch: 12/12 PASS.
- Full frontend build/lint was not executed in the review container because dependency installation timed out; run `npm ci`, `npm run lint`, and `npm run build` locally before deployment.
