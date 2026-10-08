const test = require("node:test");
const assert = require("node:assert/strict");

const Role = require("../src/models/Role");
const Permission = require("../src/models/Permission");
const {
    getEffectivePermissions,
    requirePermission,
} = require("../src/middleware/permissionMiddleware");

const query = (value) => ({
    select() {
        return this;
    },
    lean: async () => value,
});

const originalRoleFindOne = Role.findOne;
const originalPermissionFind = Permission.find;

test.afterEach(() => {
    Role.findOne = originalRoleFindOne;
    Permission.find = originalPermissionFind;
});

test("effective permissions include inherited role permissions", async () => {
    const roles = {
        manager: { permissions: ["users.view"], parentRole: "staff" },
        staff: { permissions: ["dashboard.view"], parentRole: null },
    };

    Role.findOne = ({ name }) => query(roles[name] ? { name, ...roles[name] } : null);

    const permissions = await getEffectivePermissions({ roles: ["manager"] });

    assert.deepEqual(
        new Set(permissions),
        new Set(["users.view", "dashboard.view"]),
    );
});

test("user allow and deny overrides are applied after role permissions", async () => {
    Role.findOne = ({ name }) =>
        query(name === "manager"
            ? { name, permissions: ["users.view", "users.edit"], parentRole: null }
            : null);

    const permissions = await getEffectivePermissions({
        roles: ["manager"],
        permissionOverrides: {
            allow: ["reports.view"],
            deny: ["users.edit"],
        },
    });

    assert.equal(permissions.includes("users.view"), true);
    assert.equal(permissions.includes("users.edit"), false);
    assert.equal(permissions.includes("reports.view"), true);
});

test("deny override wins when the permission is inherited from a parent role", async () => {
    const roles = {
        manager: { permissions: ["users.view"], parentRole: "staff" },
        staff: { permissions: ["reports.view"], parentRole: null },
    };

    Role.findOne = ({ name }) => query(roles[name] ? { name, ...roles[name] } : null);

    const permissions = await getEffectivePermissions({
        roles: ["manager"],
        permissionOverrides: { deny: ["reports.view"] },
    });

    assert.deepEqual(permissions, ["users.view"]);
});

test("wildcard role permissions include the current permission catalog", async () => {
    Role.findOne = () =>
        query({ name: "admin", permissions: ["*"], parentRole: null });
    Permission.find = () =>
        query([{ key: "users.view" }, { key: "roles.edit" }]);

    const permissions = await getEffectivePermissions({ roles: ["admin"] });

    assert.equal(permissions.includes("*"), true);
    assert.equal(permissions.includes("users.view"), true);
    assert.equal(permissions.includes("roles.edit"), true);
});

test("missing roles do not grant permissions", async () => {
    Role.findOne = () => query(null);

    const permissions = await getEffectivePermissions({ roles: ["missing-role"] });

    assert.deepEqual(permissions, []);
});

test("requirePermission calls next when one required permission is granted", async () => {
    Role.findOne = () =>
        query({ name: "manager", permissions: ["users.view"], parentRole: null });

    const req = { user: { roles: ["manager"] } };
    const next = (error) => {
        assert.equal(error, undefined);
    };

    await requirePermission("users.view", "users.edit")(req, {}, next);

    assert.deepEqual(req.permissions, ["users.view"]);
});

test("requirePermission passes a 403 error when permission is missing", async () => {
    Role.findOne = () =>
        query({ name: "manager", permissions: ["users.view"], parentRole: null });

    const req = { user: { roles: ["manager"] } };
    let capturedError;

    await requirePermission("users.delete")(req, {}, (error) => {
        capturedError = error;
    });

    assert.equal(capturedError?.statusCode, 403);
    assert.match(capturedError?.message || "", /permission/i);
});

test("requirePermission passes a 401 error when authentication is missing", async () => {
    let capturedError;

    await requirePermission("users.view")({}, {}, (error) => {
        capturedError = error;
    });

    assert.equal(capturedError?.statusCode, 401);
    assert.match(capturedError?.message || "", /authentication required/i);
});
