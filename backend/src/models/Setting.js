const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true, trim: true, lowercase: true },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
    label: { type: String, trim: true, maxlength: 120 },
    group: { type: String, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 300 },
    type: { type: String, enum: ["string", "boolean", "number"], default: "string" },
    isPublic: { type: Boolean, default: false }
}, { timestamps: true });
module.exports = mongoose.model("Setting", settingSchema);
