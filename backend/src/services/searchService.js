const User = require("../models/User");
const Role = require("../models/Role");
const Permission = require("../models/Permission");
const escape = (v) => String(v || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const search = async (q, permissions = []) => {
    const term = String(q || "").trim();
    if (term.length < 2) return { users: [], roles: [], permissions: [] };
    const regex = new RegExp(escape(term), "i");
    const [users, roles, perms] = await Promise.all([
        permissions.includes("*") || permissions.includes("users.view") ? User.find({ $or: [{ name: regex }, { email: regex }] }).select("name email roles status").limit(8).lean() : [],
        permissions.includes("*") || permissions.includes("roles.view") ? Role.find({ $or: [{ name: regex }, { label: regex }] }).select("name label description").limit(8).lean() : [],
        permissions.includes("*") || permissions.includes("permissions.view") ? Permission.find({ $or: [{ key: regex }, { label: regex }] }).select("key label group").limit(8).lean() : []
    ]);
    return { users, roles, permissions: perms };
};
module.exports = { search };
