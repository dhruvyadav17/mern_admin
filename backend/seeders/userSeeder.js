require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../src/models/User");
const { hashPassword } = require("../src/utils/password");

const isProduction = process.env.NODE_ENV === "production";

const buildSeedUsers = async () => {
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;

    if (isProduction && !adminPassword) {
        throw new Error("SEED_ADMIN_PASSWORD is required when seeding production");
    }

    const users = [
        {
            name: process.env.SEED_ADMIN_NAME || "Admin User",
            email: process.env.SEED_ADMIN_EMAIL || "admin@example.com",
            password: await hashPassword(adminPassword || "ChangeMe123!"),
            role: "admin",
            roles: ["admin"],
            status: "active"
        }
    ];

    if (process.env.SEED_DEMO_USER_PASSWORD || !isProduction) {
        users.push({
            name: process.env.SEED_DEMO_USER_NAME || "Demo User",
            email: process.env.SEED_DEMO_USER_EMAIL || "user@example.com",
            password: await hashPassword(process.env.SEED_DEMO_USER_PASSWORD || "ChangeMe123!"),
            role: "user",
            roles: ["user"],
            status: "active"
        });
    }

    return users;
};

async function seedUsers() {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
        throw new Error("MONGO_URI is not configured");
    }

    await mongoose.connect(mongoUri);

    try {
        const users = await buildSeedUsers();

        for (const user of users) {
            await User.updateOne(
                { email: user.email.toLowerCase() },
                {
                    $set: {
                        ...user,
                        email: user.email.toLowerCase(),
                        authVersion: 0,
                        permissionOverrides: { allow: [], deny: [] }
                    }
                },
                { upsert: true, runValidators: true }
            );
            console.log(`Seeded: ${user.email.toLowerCase()}`);
        }

        console.log(`Seed complete. Processed ${users.length} users.`);
    } finally {
        await mongoose.disconnect();
    }
}

seedUsers().catch((error) => {
    console.error("User seed failed:", error.message);
    process.exitCode = 1;
});
