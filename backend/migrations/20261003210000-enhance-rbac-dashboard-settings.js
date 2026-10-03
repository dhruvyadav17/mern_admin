const DEFAULT_PERMISSIONS = [
  ["users.role.assign.system", "Assign system roles", "Users", "Assign protected system roles"],
  ["users.export", "Export users", "Users", "Export user records"],
  ["audit.export", "Export audit logs", "Audit", "Export audit records"],
  ["settings.view", "View settings", "System", "View system settings"],
  ["settings.manage", "Manage settings", "System", "Update system settings"]
];
module.exports = {
  async up(db) {
    const now = new Date();
    for (const [key, label, group, description] of DEFAULT_PERMISSIONS) {
      const [resource, action] = key.split(".");
      await db.collection("permissions").updateOne({ key }, { $set: { key, label, group, resource, action, description, isSystem: true, updatedAt: now }, $setOnInsert: { createdAt: now } }, { upsert: true });
    }
    await db.collection("permissions").createIndex({ resource: 1, action: 1 });
    await db.collection("roles").updateMany({ parentRole: { $exists: false } }, { $set: { parentRole: null, updatedAt: now } });
    const allPermissions = await db.collection("permissions").find({}).toArray();
    for (const p of allPermissions) { const [resource, ...rest] = String(p.key).split("."); await db.collection("permissions").updateOne({ _id: p._id }, { $set: { resource, action: rest.join(".") || "manage" } }); }
    await db.createCollection("settings").catch(() => {});
    const defaults = [
      ["app.name", "MERN Admin", "Application Name", "General", "string", true],
      ["app.timezone", "Asia/Kolkata", "Timezone", "General", "string", true],
      ["app.date_format", "DD MMM YYYY", "Date Format", "General", "string", true],
      ["registration.enabled", false, "Public Registration", "Registration", "boolean", false],
      ["registration.email_verification", false, "Email Verification", "Registration", "boolean", false],
      ["security.session_timeout_minutes", 1440, "Session Timeout (minutes)", "Security", "number", false],
      ["maintenance.enabled", false, "Maintenance Mode", "Maintenance", "boolean", true]
    ];
    for (const [key, value, label, group, type, isPublic] of defaults) await db.collection("settings").updateOne({ key }, { $setOnInsert: { key, value, label, group, type, isPublic, createdAt: now, updatedAt: now } }, { upsert: true });
    await db.collection("settings").createIndex({ key: 1 }, { unique: true });
  },
  async down(db) {
    await db.collection("permissions").deleteMany({ key: { $in: DEFAULT_PERMISSIONS.map(x => x[0]) } });
    await db.collection("settings").drop().catch(() => {});
  }
};
