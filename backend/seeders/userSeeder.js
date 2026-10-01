const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

const connectDB = require("../src/config/db");
const User = require("../src/models/User");

dotenv.config();

const seedUsers = async () => {
    try {
        await connectDB();

        await User.deleteMany({});

        const password = await bcrypt.hash("Admin@123", 10);

        await User.insertMany([
            {
                name: "Admin User",
                email: "admin@example.com",
                password: password,
                role: "admin",
                status: "active"
            },
            {
                name: "Normal User",
                email: "user@example.com",
                password: await bcrypt.hash("User@123", 10),
                role: "user",
                status: "active"
            }
        ]);

        console.log("Users seeded successfully");

        process.exit(0);
    } catch (error) {
        console.error("Seeder failed:", error.message);

        process.exit(1);
    }
};

seedUsers();