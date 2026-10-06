# MERN Admin — AdminLTE 4 + Dynamic RBAC

This version separates **Role Management**, **Permission Management**, and **Role Permission Assignment**.

## Access-control model

`User -> Role -> Permissions + optional User Allow/Deny overrides`

Permissions are stored in MongoDB. Route middleware resolves the current user's role and permissions at request time, so changing a role's permissions changes API access without hardcoding role names into controllers.

### Admin modules

- Role Management: create, view, update, delete roles
- Permission Management: create, view, update, delete permissions
- Role Permissions: assign/remove permissions for each role
- User Permission Overrides: per-user allow/deny exceptions
- User Management
- Audit Logs

### Backend route protection

Examples:

- `GET /api/users` -> `users.view`
- `POST /api/users` -> `users.create`
- `PUT /api/users/:id` -> `users.edit`
- `DELETE /api/users/:id` -> `users.delete`
- `GET /api/roles` -> `roles.view`
- `POST/PUT/DELETE /api/roles` -> `roles.manage`
- Permission CRUD -> `permissions.view` / `permissions.manage`
- Role assignment -> `role-permissions.view` / `role-permissions.manage`
- User overrides -> `user-permissions.view` / `user-permissions.manage`

Frontend route/menu/button visibility uses the same permission keys, but backend authorization remains the security boundary.

## Setup

```bash
cd backend
npm ci
npm run db:migrate
npm run seed
npm run dev
```

```bash
cd frontend
npm ci
npm run dev
```

Keep your existing `backend/.env` and configure `frontend/.env` from `.env.example`.

## Migration note

The clean migrations create the application collections and indexes. The database seeder creates the built-in permission catalog, system roles, settings, and seed users. Existing `admin` keeps full `*` access; existing `user` receives basic dashboard/profile/password permissions.

For sample data, use `npm run seed:sample` or `npm run seed:all`. The sample seeder can create up to 10,000 users and several multi-role combinations.
