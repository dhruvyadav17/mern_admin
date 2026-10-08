const test = require("node:test");
const assert = require("node:assert/strict");

const Role = require("../src/models/Role");
const roleService = require("../src/services/roleService");
const permissionService = require("../src/services/permissionService");
const {
  assertPermission,
  ensureCanGrantPermissions,
  guardAssignableRoles,
} = require("../src/utils/accessPolicy");
const { getEffectivePermissions, requirePermission } = require("../src/middleware/permissionMiddleware");
const Permission = require("../src/models/Permission");

const query = (value) => ({
  select() {
    return this;
  },
  lean: async () => value,
});

const originalRoleFind = Role.find;
const originalRoleFindOne = Role.findOne;
const originalRoleFindById = Role.findById;
const originalPermissionFind = Permission.find;
const originalPermissionFindById = Permission.findById;

test.afterEach(() => {
  Role.find = originalRoleFind;
  Role.findOne = originalRoleFindOne;
  Role.findById = originalRoleFindById;
  Permission.find = originalPermissionFind;
  Permission.findById = originalPermissionFindById;
});

test("missing authentication cannot pass the permission middleware", async () => {
  let capturedError;
  await requirePermission("users.delete")({}, {}, (error) => {
    capturedError = error;
  });
  assert.equal(capturedError?.statusCode, 401);
});

test("a different permission cannot be used as a bypass", () => {
  assert.throws(
    () => assertPermission({ permissions: ["users.view"] }, "users.delete"),
    (error) => error.statusCode === 403,
  );
});

test("wildcard permission is the only explicit broad-access bypass", () => {
  assert.doesNotThrow(() =>
    assertPermission({ permissions: ["*"] }, "users.delete"),
  );
});

test("deny override removes inherited access", async () => {
  Role.findOne = ({ name }) =>
    query(
      name === "manager"
        ? { name, permissions: ["users.view", "users.delete"], parentRole: null }
        : null,
    );

  const permissions = await getEffectivePermissions({
    roles: ["manager"],
    permissionOverrides: { allow: [], deny: ["users.delete"] },
  });

  assert.equal(permissions.includes("users.view"), true);
  assert.equal(permissions.includes("users.delete"), false);
});

test("actor cannot grant a permission they do not possess", () => {
  assert.throws(
    () => ensureCanGrantPermissions({ permissions: ["users.view"] }, ["users.delete"]),
    (error) => error.statusCode === 403,
  );
});

test("assigning a protected system role requires the dedicated permission", async () => {
  Role.find = () =>
    query([{ name: "admin", isSystem: true }]);

  await assert.rejects(
    guardAssignableRoles({ permissions: ["users.role.assign"] }, ["admin"]),
    (error) => error.statusCode === 403,
  );
});

test("custom role assignment cannot escalate beyond actor permissions", async () => {
  Role.find = () =>
    query([{ name: "reporting", isSystem: false }]);
  Role.findOne = () =>
    query({
      name: "reporting",
      permissions: ["reports.view", "users.delete"],
      parentRole: null,
    });

  await assert.rejects(
    guardAssignableRoles({ permissions: ["users.role.assign", "reports.view"] }, ["reporting"]),
    (error) => error.statusCode === 403,
  );
});

test("system role permissions cannot be changed even when the role is not named admin", async () => {
  const systemRole = {
    _id: "system-role-id",
    name: "supervisor",
    isSystem: true,
    permissions: ["users.view"],
    parentRole: null,
    save: async () => {
      throw new Error("save should not be reached");
    },
  };
  Role.findById = async () => systemRole;

  await assert.rejects(
    roleService.updateRole("system-role-id", { permissions: ["users.delete"] }),
    /System role permissions cannot be changed/,
  );
});




test("system role inheritance cannot be cleared or changed", async () => {
  const systemRole = {
    _id: "system-role-id",
    name: "supervisor",
    isSystem: true,
    permissions: ["users.view"],
    parentRole: "admin",
    save: async () => {
      throw new Error("save should not be reached");
    },
  };
  Role.findById = async () => systemRole;

  await assert.rejects(
    roleService.updateRole("system-role-id", { parentRole: null }),
    /System role inheritance cannot be changed/,
  );
});

test("system permission key cannot be changed through the service", async () => {
  Permission.findById = async () => ({
    _id: "system-permission-id",
    key: "users.view",
    isSystem: true,
  });

  await assert.rejects(
    permissionService.updatePermission("system-permission-id", { key: "users.delete" }),
    /System permission key cannot be changed/,
  );
});

test("system permission cannot be deleted through the service", async () => {
  Permission.findById = async () => ({
    _id: "system-permission-id",
    key: "users.view",
    isSystem: true,
  });

  await assert.rejects(
    permissionService.deletePermission("system-permission-id"),
    /System permission cannot be deleted/,
  );
});
