module.exports = {
  async up(db) {
    await db.createCollection("notifications");

    await db.collection("notifications").createIndex(
      {
        recipient: 1,
        isRead: 1,
        createdAt: -1,
      },
      {
        name: "recipient_1_isRead_1_createdAt_-1",
      },
    );

    await db.collection("notifications").createIndex(
      {
        expiresAt: 1,
      },
      {
        name: "expiresAt_1",
        expireAfterSeconds: 0,
      },
    );
  },

  async down(db) {
    await db.collection("notifications").drop();
  },
};