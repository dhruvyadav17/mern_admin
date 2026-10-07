const hasPermission = (permissions = [], required) => permissions.includes("*") || permissions.includes(required);
const applyOverrides = (basePermissions = [], allow = [], deny = []) => {
    const set = new Set(basePermissions);
    allow.forEach(p => set.add(p));
    deny.forEach(p => set.delete(p));
    return [...set];
};
module.exports = { hasPermission, applyOverrides };
