const Setting = require("../models/Setting");
const AppError = require("../utils/AppError");

const DEFAULTS = [
    { key: "app.name", value: "MERN Admin", label: "Application Name", group: "General", type: "string", isPublic: true },
    { key: "app.timezone", value: "Asia/Kolkata", label: "Timezone", group: "General", type: "string", isPublic: true },
    { key: "app.date_format", value: "DD MMM YYYY", label: "Date Format", group: "General", type: "string", isPublic: true },
    { key: "registration.enabled", value: false, label: "Public Registration", group: "Registration", type: "boolean", isPublic: false },
    { key: "registration.email_verification", value: false, label: "Email Verification", group: "Registration", type: "boolean", isPublic: false },
    { key: "security.session_timeout_minutes", value: 1440, label: "Session Timeout (minutes)", group: "Security", type: "number", isPublic: false },
    { key: "maintenance.enabled", value: false, label: "Maintenance Mode", group: "Maintenance", type: "boolean", isPublic: true }
];
const ensureDefaults = async () => { for (const item of DEFAULTS) await Setting.updateOne({ key: item.key }, { $setOnInsert: item }, { upsert: true }); };
const list = async () => { await ensureDefaults(); return Setting.find().sort({ group: 1, key: 1 }).lean(); };
const getValue = async (key, fallback = null) => { await ensureDefaults(); const item = await Setting.findOne({ key }).lean(); return item ? item.value : fallback; };
const publicSettings = async () => { await ensureDefaults(); const items = await Setting.find({ isPublic: true }).select("key value").lean(); return Object.fromEntries(items.map((x) => [x.key, x.value])); };
const update = async (updates = {}) => {
    await ensureDefaults();
    const keys = Object.keys(updates);
    const known = await Setting.find({ key: { $in: keys } }).lean();
    if (known.length !== keys.length) throw new AppError("One or more settings are invalid", 400);
    for (const setting of known) {
        const value = updates[setting.key];
        if (setting.type === "boolean" && typeof value !== "boolean") throw new AppError(`${setting.key} must be boolean`, 400);
        if (setting.type === "number" && !Number.isFinite(Number(value))) throw new AppError(`${setting.key} must be a number`, 400);
        await Setting.updateOne({ key: setting.key }, { $set: { value: setting.type === "number" ? Number(value) : value } });
    }
    return list();
};
module.exports = { list, publicSettings, getValue, update, DEFAULTS, ensureDefaults };
