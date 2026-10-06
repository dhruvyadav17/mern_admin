const COLLECTIONS = [
  "users",
  "roles",
  "permissions",
  "settings",
  "auditlogs",
  "passwordresettokens",
  "emailverificationtokens",
];

module.exports = {
  async up(db) {
    for (const name of COLLECTIONS) {
      const exists = await db.listCollections({ name }, { nameOnly: true }).toArray();
      if (!exists.length) {
        await db.createCollection(name);
      }
    }

    await db.collection("users").createIndex(
      { email: 1 },
      { name: "email_1", unique: true }
    );
    await db.collection("users").createIndex(
      { roles: 1, status: 1 },
      { name: "roles_1_status_1" }
    );
    await db.collection("users").createIndex(
      { createdAt: -1 },
      { name: "createdAt_-1" }
    );

    await db.collection("roles").createIndex(
      { name: 1 },
      { name: "name_1", unique: true }
    );
    await db.collection("roles").createIndex(
      { parentRole: 1 },
      { name: "parentRole_1" }
    );

    await db.collection("permissions").createIndex(
      { key: 1 },
      { name: "key_1", unique: true }
    );
    await db.collection("permissions").createIndex(
      { resource: 1, action: 1 },
      { name: "resource_1_action_1" }
    );

    await db.collection("settings").createIndex(
      { key: 1 },
      { name: "key_1", unique: true }
    );

    await db.collection("auditlogs").createIndex(
      { createdAt: -1 },
      { name: "createdAt_-1" }
    );
    await db.collection("auditlogs").createIndex(
      { actorId: 1, createdAt: -1 },
      { name: "actorId_1_createdAt_-1" }
    );
    await db.collection("auditlogs").createIndex(
      { action: 1, createdAt: -1 },
      { name: "action_1_createdAt_-1" }
    );
    await db.collection("auditlogs").createIndex(
      { targetId: 1, createdAt: -1 },
      { name: "targetId_1_createdAt_-1" }
    );

    for (const collection of ["passwordresettokens", "emailverificationtokens"]) {
      await db.collection(collection).createIndex(
        { userId: 1 },
        { name: "userId_1" }
      );
      await db.collection(collection).createIndex(
        { tokenHash: 1 },
        { name: "tokenHash_1", unique: true }
      );
      await db.collection(collection).createIndex(
        { expiresAt: 1 },
        { name: "expiresAt_1", expireAfterSeconds: 0 }
      );
    }
  },

  async down(db) {
    for (const name of [...COLLECTIONS].reverse()) {
      await db.collection(name).drop().catch(() => {});
    }
  },
};
