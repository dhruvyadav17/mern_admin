const { validateEnv } = require("./config/env");

validateEnv();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
    try {
        await connectDB();

        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

        const shutdown = async (signal) => {
            console.log(`${signal} received. Shutting down...`);
            server.close(async () => {
                const mongoose = require("mongoose");
                await mongoose.connection.close();
                process.exit(0);
            });
        };

        process.once("SIGTERM", () => shutdown("SIGTERM"));
        process.once("SIGINT", () => shutdown("SIGINT"));
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();

