const test = require("node:test");
const assert = require("node:assert/strict");

const Permission = require("../src/models/Permission");
const Role = require("../src/models/Role");
const User = require("../src/models/User");
const permissionService = require("../src/services/permissionService");

const originalPermissionFindById = Permission.findById;
const originalPermissionExists = Permission.exists;
const originalRoleUpdateMany = Role.updateMany;
const originalUserUpdateMany = User.updateMany;

test.afterEach(() => {
  Permission.findById = originalPermissionFindById;
  Permission.exists = originalPermissionExists;
  Role.updateMany = originalRoleUpdateMany;
  User.updateMany = originalUserUpdateMany;
});

test("permission rename updates all references without positional-array leftovers", async () => {
  let roleUpdate;
  const userUpdates = [];

  Permission.findById = async () => ({
    _id: "permission-id",
    key: "reports.view",
    label: "Reports View",
    group: "Reports",
    description: "View reports",
    isSystem: false,
    save: async function save() { this.key = "reports.read"; },
  });
  Permission.exists = async () => false;
  Role.updateMany = async (...args) => { roleUpdate = args; return {}; };
  User.updateMany = async (...args) => { userUpdates.push(args); return {}; };

  await permissionService.updatePermission("permission-id", { key: "reports.read" });

  assert.equal(roleUpdate[0].permissions, "reports.view");
  assert.deepEqual(roleUpdate[1][0].$set.permissions.$setUnion[1], []);
  assert.equal(userUpdates.length, 2);
  assert.equal(userUpdates[0][0]["permissionOverrides.allow"], "reports.view");
  assert.equal(userUpdates[1][0]["permissionOverrides.deny"], "reports.view");
});
