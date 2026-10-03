module.exports = {
    async up(db) {
        const now = new Date();
        await db.collection("permissions").updateOne(
            { key: "users.role.assign" },
            { $set: { key: "users.role.assign", label: "Assign user roles", group: "Users", description: "Assign or change a user's role", isSystem: true, updatedAt: now }, $setOnInsert: { createdAt: now } },
            { upsert: true }
        );
        await db.collection("permissions").createIndex({ key: 1 }, { unique: true });
    },
    async down(db) {
        await db.collection("permissions").deleteOne({ key: "users.role.assign", isSystem: true });
    }
};
