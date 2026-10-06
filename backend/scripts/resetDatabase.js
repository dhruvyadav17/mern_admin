require("dotenv").config();

const { spawnSync } = require("node:child_process");
const mongoose = require("mongoose");

const isProduction = process.env.NODE_ENV === "production";
const confirmation = process.env.DB_RESET_CONFIRM;

if (isProduction) {
  throw new Error("Database reset is disabled when NODE_ENV=production");
}

if (confirmation !== "YES") {
  throw new Error("Refusing to reset database. Set DB_RESET_CONFIRM=YES to continue.");
}

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is not configured");
}

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGO_DB_NAME || "mern_admin1",
  });

  try {
    const db = mongoose.connection.db;
    console.log(`Dropping database: ${db.databaseName}`);
    await db.dropDatabase();
  } finally {
    await mongoose.disconnect();
  }

  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  run(npx, ["migrate-mongo", "up"]);
  run(process.execPath, ["seeders/databaseSeeder.js"]);
  run(process.execPath, ["seeders/sampleDataSeeder.js"]);

  console.log("Database reset, migration, and seed completed successfully.");
})().catch((error) => {
  console.error("Database reset failed:", error.message);
  process.exitCode = 1;
});
