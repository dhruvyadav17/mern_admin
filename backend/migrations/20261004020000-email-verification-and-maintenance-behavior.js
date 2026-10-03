module.exports = {
  async up(db) {
    const now = new Date();

    await db.collection("users").updateMany(
      { emailVerifiedAt: { $exists: false } },
      { $set: { emailVerifiedAt: now, updatedAt: now } }
    );

    await db.collection("emailverificationtokens").createIndex(
      { tokenHash: 1 },
      { unique: true }
    );
    await db.collection("emailverificationtokens").createIndex({ userId: 1 });
    await db.collection("emailverificationtokens").createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 }
    );

    await db.collection("settings").updateOne(
      { key: "registration.email_verification" },
      {
        $set: {
          description: "Requires public registrations to verify email before login.",
          updatedAt: now
        }
      }
    );
    await db.collection("settings").updateOne(
      { key: "security.session_timeout_minutes" },
      {
        $set: {
          description: "Controls JWT expiry and authentication cookie lifetime.",
          updatedAt: now
        }
      }
    );
    await db.collection("settings").updateOne(
      { key: "maintenance.enabled" },
      {
        $set: {
          description: "Blocks non-admin access while keeping admin sign-in available.",
          updatedAt: now
        }
      }
    );
  },

  async down(db) {
    await db.collection("users").updateMany(
      {},
      { $unset: { emailVerifiedAt: "" } }
    );
    await db.collection("emailverificationtokens").drop().catch(() => {});
  }
};
