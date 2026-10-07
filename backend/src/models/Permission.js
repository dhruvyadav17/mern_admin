const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    label: { type: String, required: true, trim: true, maxlength: 120 },
    group: { type: String, required: true, trim: true, maxlength: 80 },
    resource: { type: String, trim: true, lowercase: true, maxlength: 80 },
    action: { type: String, trim: true, lowercase: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 300, default: "" },
    isSystem: { type: Boolean, default: false }
}, { timestamps: true });

permissionSchema.index({ resource: 1, action: 1 });
module.exports = mongoose.model("Permission", permissionSchema);
