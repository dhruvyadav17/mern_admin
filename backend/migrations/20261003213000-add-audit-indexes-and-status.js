module.exports = {
  async up(db) {
    await db.collection("users").updateMany({ status: { $exists: false } }, { $set: { status: "active" } });
    await db.collection("users").createIndex({ role: 1, status: 1 });
    await db.collection("users").createIndex({ createdAt: -1 });
    await db.collection("auditlogs").createIndex({ actorId: 1, createdAt: -1 });
    await db.collection("auditlogs").createIndex({ action: 1, createdAt: -1 });
    await db.collection("auditlogs").createIndex({ targetId: 1, createdAt: -1 });
  },
  async down(db) {
    for (const name of ["role_1_status_1", "createdAt_-1"]) { await db.collection("users").dropIndex(name).catch(() => {}); }
    for (const name of ["actorId_1_createdAt_-1", "action_1_createdAt_-1", "targetId_1_createdAt_-1"]) await db.collection("auditlogs").dropIndex(name).catch(() => {});
  }
};
