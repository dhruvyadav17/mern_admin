require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../src/models/User");
const Role = require("../src/models/Role");
const Permission = require("../src/models/Permission");
const Setting = require("../src/models/Setting");
const { hashPassword } = require("../src/utils/password");

const DEFAULT_PERMISSIONS = [
  ["dashboard.view", "View dashboard", "Dashboard", "Open the admin dashboard"],
  ["users.view", "View users", "Users", "View user records"],
  ["users.create", "Create users", "Users", "Create new users"],
  ["users.edit", "Edit users", "Users", "Edit user details"],
  ["users.delete", "Delete users", "Users", "Delete users"],
  ["users.status", "Change user status", "Users", "Activate or deactivate users"],
  ["users.role.assign", "Assign user roles", "Users", "Assign one or more roles to users"],
  ["users.role.assign.system", "Assign system roles", "Users", "Assign protected system roles"],
  ["users.export", "Export users", "Users", "Export user records"],
  ["audit.export", "Export audit logs", "Audit", "Export audit records"],
  ["settings.view", "View settings", "System", "View system settings"],
  ["settings.manage", "Manage settings", "System", "Update system settings"],
  ["roles.view", "View roles", "Roles", "View roles"],
  ["roles.manage", "Manage roles", "Roles", "Create, update and delete roles"],
  ["permissions.view", "View permissions", "Permissions", "View permission definitions"],
  ["permissions.manage", "Manage permissions", "Permissions", "Create, update and delete permissions"],
  ["role-permissions.view", "View role permissions", "Permissions", "View role permission assignments"],
  ["role-permissions.manage", "Manage role permissions", "Permissions", "Assign permissions to roles"],
  ["user-permissions.view", "View user overrides", "Permissions", "View per-user permission overrides"],
  ["user-permissions.manage", "Manage user overrides", "Permissions", "Manage per-user allow/deny overrides"],
  ["audit.view", "View audit logs", "Audit", "View security and administrative audit logs"],
  ["profile.view", "View profile", "Account", "View own profile"],
  ["profile.update", "Update own profile", "Profile", "Update your own name and email"],
  ["password.change", "Change password", "Account", "Change own password"],
];

const DEFAULT_SETTINGS = [
  ["app.name", "MERN Admin", "Application Name", "General", "string", true],
  ["app.timezone", "Asia/Kolkata", "Timezone", "General", "string", true],
  ["app.date_format", "DD MMM YYYY", "Date Format", "General", "string", true],
  ["registration.enabled", false, "Public Registration", "Registration", "boolean", false],
  ["registration.email_verification", false, "Email Verification", "Registration", "boolean", false],
  ["security.session_timeout_minutes", 1440, "Session Timeout (minutes)", "Security", "number", false],
  ["maintenance.enabled", false, "Maintenance Mode", "Maintenance", "boolean", true],
];

const DEFAULT_ROLES = [
  {
    name: "admin",
    label: "Administrator",
    description: "Full system access",
    permissions: ["*"],
    parentRole: null,
    isSystem: true,
  },
  {
    name: "user",
    label: "User",
    description: "Standard user access",
    permissions: ["dashboard.view", "profile.view", "profile.update", "password.change"],
    parentRole: null,
    isSystem: true,
  },
];

const isProduction = process.env.NODE_ENV === "production";

async function seedDatabase() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGO_URI is not configured");

  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const resetSeedPasswords = process.env.SEED_RESET_PASSWORDS === "true";

  if (!adminPassword) {
    throw new Error("SEED_ADMIN_PASSWORD is required for database seeding");
  }

  await mongoose.connect(mongoUri, {
    dbName: process.env.MONGO_DB_NAME || "mern_admin1",
  });

  try {
    const now = new Date();

    for (const [key, label, group, description] of DEFAULT_PERMISSIONS) {
      const [resource, ...rest] = key.split(".");
      await Permission.updateOne(
        { key },
        {
          $set: {
            key,
            label,
            group,
            resource,
            action: rest.join(".") || "manage",
            description,
            isSystem: true,
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true, runValidators: true }
      );
    }

    for (const role of DEFAULT_ROLES) {
      await Role.updateOne(
        { name: role.name },
        {
          $set: { ...role, updatedAt: now },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true, runValidators: true }
      );
    }

    for (const [key, value, label, group, type, isPublic] of DEFAULT_SETTINGS) {
      await Setting.updateOne(
        { key },
        {
          $set: { key, value, label, group, type, isPublic, updatedAt: now },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true, runValidators: true }
      );
    }

    const users = [
      {
        name: process.env.SEED_ADMIN_NAME || "Admin User",
        email: (process.env.SEED_ADMIN_EMAIL || "admin@example.com").toLowerCase(),
        password: await hashPassword(adminPassword),
        roles: ["admin"],
        status: "active",
        emailVerifiedAt: new Date(),
      },
    ];

    if (process.env.SEED_DEMO_USER_PASSWORD) {
      users.push({
        name: process.env.SEED_DEMO_USER_NAME || "Demo User",
        email: (process.env.SEED_DEMO_USER_EMAIL || "user@example.com").toLowerCase(),
        password: await hashPassword(process.env.SEED_DEMO_USER_PASSWORD),
        roles: ["user"],
        status: "active",
        emailVerifiedAt: new Date(),
      });
    }

    for (const user of users) {
      const existing = await User.exists({ email: user.email });

      if (existing) {
        await User.updateOne(
          { email: user.email },
          {
            $set: {
              name: user.name,
              roles: user.roles,
              status: user.status,
              emailVerifiedAt: user.emailVerifiedAt,
              ...(resetSeedPasswords ? { password: user.password, authVersion: 0 } : {}),
            },
          },
          { runValidators: true }
        );
      } else {
        await User.create({
          ...user,
          authVersion: 0,
          permissionOverrides: { allow: [], deny: [] },
        });
      }

      console.log(`Seeded user: ${user.email}`);
    }

    console.log(`Seed complete: ${DEFAULT_PERMISSIONS.length} permissions, ${DEFAULT_ROLES.length} roles, ${DEFAULT_SETTINGS.length} settings, ${users.length} users.`);
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase().catch((error) => {
  console.error("Database seed failed:", error);
  process.exitCode = 1;
});
