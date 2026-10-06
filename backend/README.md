# Backend

## Setup

1. Copy `.env.example` to `.env` and keep real secrets there.
2. Install dependencies: `npm ci`
3. Run the clean migration: `npm run db:migrate`
4. Seed roles, permissions, settings, and users: `npm run seed`
5. Optional sample data: `npm run seed:sample`
6. Start development: `npm run dev`

## Fresh database reset

For local development only, this performs a destructive reset of the configured database, removes the old database/changelog, runs the single baseline migration, and seeds the complete default data set:

```powershell
$env:DB_RESET_CONFIRM="YES"
npm run db:reset
```

`db:reset` is blocked when `NODE_ENV=production` and requires the explicit `DB_RESET_CONFIRM=YES` flag.

## Database design

The clean baseline uses these MongoDB collections:

- `users`
- `roles`
- `permissions`
- `settings`
- `auditlogs`
- `passwordresettokens`
- `emailverificationtokens`

`users` uses `roles[]` as the canonical role field. There is no database `role` field. The old migration chain and legacy `role` cleanup migration were removed; a fresh database is created directly in the final schema.

The application model remains the source of truth for field validation, while the migration creates the collections and indexes required by the models.

## Seeding

`npm run seed` runs `seeders/databaseSeeder.js` and upserts:

- system roles (`admin`, `user`)
- complete system permission catalog
- default application/security/registration/maintenance settings
- configured admin user
- optional demo user

Existing seeded users are updated only for the intended identity/access fields; their password/auth/session state is not blindly reset on every seed run.

## Production notes

- Use a strong `JWT_SECRET` (32+ characters).
- Keep `.env` out of version control.
- Use HTTPS in production.
- The API validates the configured frontend origin for state-changing cookie-authenticated requests.


### Seed credentials

Set `SEED_ADMIN_PASSWORD` before running `npm run seed` or `npm run db:reset`. The seeder never overwrites an existing user password unless the database is recreated.
