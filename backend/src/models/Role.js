const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true, lowercase: true },
    label: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 300, default: "" },
    permissions: [{ type: String, trim: true }],
    parentRole: { type: String, trim: true, lowercase: true, default: null },
    isSystem: { type: Boolean, default: false }
}, { timestamps: true });

roleSchema.index({ parentRole: 1 });
module.exports = mongoose.model("Role", roleSchema);
