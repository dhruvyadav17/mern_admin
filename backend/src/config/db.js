const mongoose = require("mongoose");

const connectDB = async () => {
    await mongoose.connect(process.env.MONGO_URI, {
        dbName: process.env.MONGO_DB_NAME || "mern_admin",
    });
    console.log(`MongoDB connected successfully: ${mongoose.connection.name}`);
};

module.exports = connectDB;
