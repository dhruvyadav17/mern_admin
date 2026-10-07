require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../src/models/User");
const Role = require("../src/models/Role");
const { hashPassword } = require("../src/utils/password");

const SAMPLE_ROLES = [
  {
    name: "manager",
    label: "Manager",
    description: "Team and operational management",
    permissions: [
      "dashboard.view",
      "users.view",
      "users.edit",
      "users.status",
      "audit.view",
    ],
    parentRole: "user",
  },
  {
    name: "support",
    label: "Support",
    description: "Customer and user support access",
    permissions: [
      "dashboard.view",
      "users.view",
      "users.edit",
      "profile.view",
      "profile.update",
    ],
    parentRole: "user",
  },
  {
    name: "editor",
    label: "Editor",
    description: "Content and application administration",
    permissions: [
      "dashboard.view",
      "settings.view",
      "settings.manage",
      "profile.view",
      "profile.update",
    ],
    parentRole: "user",
  },
  {
    name: "auditor",
    label: "Auditor",
    description: "Read-only audit access",
    permissions: [
      "dashboard.view",
      "users.view",
      "audit.view",
      "audit.export",
      "profile.view",
    ],
    parentRole: "user",
  },
  {
    name: "hr",
    label: "HR",
    description: "User and account administration",
    permissions: [
      "dashboard.view",
      "users.view",
      "users.create",
      "users.edit",
      "users.status",
      "profile.view",
    ],
    parentRole: "user",
  },
  {
    name: "sales",
    label: "Sales",
    description: "Sales team access",
    permissions: [
      "dashboard.view",
      "users.view",
      "profile.view",
      "profile.update",
    ],
    parentRole: "user",
  },
  {
    name: "finance",
    label: "Finance",
    description: "Finance operations access",
    permissions: [
      "dashboard.view",
      "audit.view",
      "profile.view",
      "profile.update",
    ],
    parentRole: "user",
  },
  {
    name: "moderator",
    label: "Moderator",
    description: "Moderation and account status access",
    permissions: [
      "dashboard.view",
      "users.view",
      "users.status",
      "profile.view",
      "profile.update",
    ],
    parentRole: "user",
  },
];

const ROLE_SETS = [
  ["user"],
  ["manager"],
  ["support"],
  ["editor"],
  ["auditor"],
  ["hr"],
  ["sales"],
  ["finance"],
  ["moderator"],
  ["manager", "auditor"],
  ["support", "sales"],
  ["hr", "auditor"],
  ["editor", "moderator"],
  ["manager", "finance"],
];

const STATUS_SEQUENCE = [
  "active",
  "active",
  "active",
  "active",
  "active",
  "inactive",
  "suspended",
];

function getUserCount() {
  const value = Number.parseInt(
    process.env.SEED_SAMPLE_USER_COUNT || "1000",
    10,
  );
  if (!Number.isInteger(value) || value < 1 || value > 10000) {
    throw new Error(
      "SEED_SAMPLE_USER_COUNT must be an integer between 1 and 10000",
    );
  }
  return value;
}

function getSampleUserPassword() {
  const password = process.env.SEED_SAMPLE_USER_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error(
      "SEED_SAMPLE_USER_PASSWORD is required and must be at least 8 characters",
    );
  }
  return password;
}

async function seedSampleRoles(now) {
  const operations = SAMPLE_ROLES.map((role) => ({
    updateOne: {
      filter: { name: role.name },
      update: {
        $set: { ...role, isSystem: false, updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      upsert: true,
    },
  }));

  if (operations.length) {
    await Role.bulkWrite(operations, { ordered: false });
  }
}

function buildSampleUsers(count, passwordHash, now) {
  const prefix = (process.env.SEED_SAMPLE_USER_PREFIX || "seed.user")
    .trim()
    .toLowerCase();
  const users = new Array(count);

  for (let index = 1; index <= count; index += 1) {
    const roles = ROLE_SETS[(index - 1) % ROLE_SETS.length];
    users[index - 1] = {
      name: `Seed User ${String(index).padStart(4, "0")}`,
      email: `${prefix}${String(index).padStart(4, "0")}@example.com`,
      password: passwordHash,
      roles,
      status: STATUS_SEQUENCE[(index - 1) % STATUS_SEQUENCE.length],
      emailVerifiedAt: now,
      authVersion: 0,
      permissionOverrides: { allow: [], deny: [] },
    };
  }

  return users;
}

async function seedSampleUsers(users, now) {
  const resetPasswords = process.env.SEED_SAMPLE_RESET_PASSWORDS === "true";

  const operations = users.map((user) => {
    const update = {
      $set: {
        name: user.name,
        roles: user.roles,
        status: user.status,
        emailVerifiedAt: user.emailVerifiedAt,
        updatedAt: now,
      },
      $setOnInsert: {
        password: user.password,
        authVersion: user.authVersion,
        permissionOverrides: user.permissionOverrides,
        createdAt: now,
      },
    };

    if (resetPasswords) {
      update.$set.password = user.password;
      delete update.$setOnInsert.password;
    }

    return {
      updateOne: {
        filter: { email: user.email },
        update,
        upsert: true,
      },
    };
  });

  for (let start = 0; start < operations.length; start += 500) {
    await User.bulkWrite(operations.slice(start, start + 500), {
      ordered: false,
    });
  }
}

async function seedSampleData() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGO_URI is not configured");

  const count = getUserCount();
  const password = getSampleUserPassword();
  const now = new Date();
  const passwordHash = await hashPassword(password);

  await mongoose.connect(mongoUri, {
    dbName: process.env.MONGO_DB_NAME || "mern_admin",
  });

  try {
    await seedSampleRoles(now);
    const users = buildSampleUsers(count, passwordHash, now);
    await seedSampleUsers(users, now);

    console.log(
      `Sample seed complete: ${SAMPLE_ROLES.length} roles, ${count} users.`,
    );
    console.log(`Sample users use the configured SEED_SAMPLE_USER_PASSWORD.`);
    console.log(
      `Password reset mode: ${process.env.SEED_SAMPLE_RESET_PASSWORDS === "true" ? "enabled" : "disabled"}.`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

seedSampleData().catch((error) => {
  console.error("Sample data seed failed:", error);
  process.exitCode = 1;
});
