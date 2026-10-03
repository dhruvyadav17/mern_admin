require("dotenv").config();

if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
}

module.exports = {
    mongodb: {
        url: process.env.MONGO_URI,
        databaseName: process.env.MONGO_DB_NAME || "mern_admin",
        options: {}
    },
    migrationsDir: "migrations",
    changelogCollectionName: "changelog",
    lockCollectionName: "changelog_lock",
    lockTtl: 0,
    migrationFileExtension: ".js",
    useFileHash: false,
    moduleSystem: "commonjs"
};
