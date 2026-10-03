const normalizeRoles = (roles, role) => {
  const source = Array.isArray(roles) && roles.length ? roles : [role || "user"];
  return [...new Set(source.map((value) => String(value).trim().toLowerCase()).filter(Boolean))];
};

module.exports = {
  async up(db) {
    const now = new Date();
    const users = await db.collection("users").find({}).project({ role: 1, roles: 1 }).toArray();
    for (const user of users) {
      const roles = normalizeRoles(user.roles, user.role);
      if (!roles.length) continue;
      await db.collection("users").updateOne(
        { _id: user._id },
        { $set: { roles, role: roles[0], updatedAt: now } }
      );
    }
    await db.collection("users").createIndex({ roles: 1 });
  },
  async down() {}
};
