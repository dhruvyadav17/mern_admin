const DEFAULT_PERMISSIONS = [
    ["dashboard.view", "View dashboard", "Dashboard", "Open the admin dashboard"],
    ["users.view", "View users", "Users", "View user records"],
    ["users.create", "Create users", "Users", "Create new users"],
    ["users.edit", "Edit users", "Users", "Edit user details"],
    ["users.delete", "Delete users", "Users", "Delete users"],
    ["users.status", "Change user status", "Users", "Activate or deactivate users"],
    ["users.role.assign", "Assign user roles", "Users", "Assign or change a user role"],
    ["users.role.assign.system", "Assign system roles", "Users", "Assign protected system roles"],
    ["users.export", "Export users", "Users", "Export user records"],
    ["audit.export", "Export audit logs", "Audit", "Export audit records"],
    ["settings.view", "View settings", "System", "View system settings"],
    ["settings.manage", "Manage settings", "System", "Update system settings"],
    ["roles.view", "View roles", "Roles", "View roles"],
    ["roles.manage", "Manage roles", "Roles", "Create, update and delete roles"],
    ["permissions.view", "View permissions", "Permissions", "View permission definitions"],
    ["permissions.manage", "Manage permissions", "Permissions", "Create, update and delete permissions"],
    ["role-permissions.view", "View role permissions", "Permissions", "View role permission assignments"],
    ["role-permissions.manage", "Manage role permissions", "Permissions", "Assign permissions to roles"],
    ["user-permissions.view", "View user overrides", "Permissions", "View per-user permission overrides"],
    ["user-permissions.manage", "Manage user overrides", "Permissions", "Manage per-user allow/deny overrides"],
    ["audit.view", "View audit logs", "Audit", "View security and administrative audit logs"],
    ["profile.view", "View profile", "Account", "View own profile"],
    ["profile.edit", "Edit profile", "Account", "Edit own profile"],
    ["password.change", "Change password", "Account", "Change own password"]
];

module.exports = {
    async up(db) {
        const now = new Date();
        const operations = DEFAULT_PERMISSIONS.map(([key, label, group, description]) => ({
            updateOne: {
                filter: { key },
                update: { $set: { key, label, group, description, isSystem: true, updatedAt: now }, $setOnInsert: { createdAt: now } },
                upsert: true
            }
        }));
        if (operations.length) await db.collection("permissions").bulkWrite(operations);
        await db.collection("permissions").createIndex({ key: 1 }, { unique: true });

        const permissionKeys = DEFAULT_PERMISSIONS.map(([key]) => key);
        await db.collection("roles").updateOne({ name: "admin" }, { $set: { permissions: ["*"], updatedAt: now } });
        await db.collection("roles").updateOne({ name: "user" }, { $set: { permissions: ["dashboard.view", "profile.view", "password.change"], updatedAt: now } });
        await db.collection("roles").updateMany({ name: { $nin: ["admin", "user"] }, permissions: { $exists: false } }, { $set: { permissions: [], updatedAt: now } });
        return permissionKeys.length;
    },
    async down(db) {
        await db.collection("permissions").deleteMany({ isSystem: true });
    }
};
