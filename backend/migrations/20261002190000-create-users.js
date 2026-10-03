module.exports = {
    async up(db) {
        const collections = await db.listCollections(
            { name: "users" },
            { nameOnly: true }
        ).toArray();

        if (collections.length === 0) {
            await db.createCollection("users");
        }

        await db.collection("users").updateMany(
            { authVersion: { $exists: false } },
            { $set: { authVersion: 0 } }
        );

        try {
            await db.collection("users").createIndex(
                { email: 1 },
                {
                    name: "email_1",
                    unique: true
                }
            );
        } catch (error) {
            if (error?.code !== 85) {
                throw error;
            }
        }
    },

    async down(db) {
        const collections = await db.listCollections(
            { name: "users" },
            { nameOnly: true }
        ).toArray();

        if (collections.length === 0) {
            return;
        }

        const indexes = await db.collection("users").indexes();
        if (indexes.some((index) => index.name === "email_1")) {
            await db.collection("users").dropIndex("email_1");
        }
    }
};
