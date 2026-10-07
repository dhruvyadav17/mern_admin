const test = require("node:test");
const assert = require("node:assert/strict");

const {
    assertPermission,
    ensureCanGrantPermissions,
    normalizeRoles
} = require("../src/utils/accessPolicy");

test("normalizeRoles prefers canonical roles array", () => {
    assert.deepEqual(
        normalizeRoles({ role: "admin", roles: [" Manager ", "manager", "User"] }),
        ["manager", "user"]
    );
});

test("normalizeRoles falls back to legacy role field", () => {
    assert.deepEqual(normalizeRoles({ role: " Admin " }), ["admin"]);
});

test("assertPermission allows wildcard actors", () => {
    assert.doesNotThrow(() => assertPermission({ permissions: ["*"] }, "users.delete"));
});

test("ensureCanGrantPermissions rejects permissions the actor does not have", () => {
    assert.throws(
        () => ensureCanGrantPermissions({ permissions: ["users.view"] }, ["users.edit"]),
        /cannot grant permissions/
    );
});
