module.exports = {
  async up(db) {
    await db.collection("users").createIndex(
      { createdAt: -1, _id: -1 },
      { name: "createdAt_-1__id_-1" },
    );
  },

  async down(db) {
    await db.collection("users").dropIndex("createdAt_-1__id_-1").catch(() => {});
  },
};
