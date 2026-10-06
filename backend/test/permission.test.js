const test = require("node:test");
const assert = require("node:assert/strict");
const { hasPermission, applyOverrides } = require("../src/utils/permissionLogic");

test("exact permission is granted", () => assert.equal(hasPermission(["users.view", "users.edit"], "users.view"), true));
test("missing permission is denied", () => assert.equal(hasPermission(["users.view"], "users.delete"), false));
test("wildcard grants permission", () => assert.equal(hasPermission(["*"], "anything.manage"), true));
test("user deny semantics can remove role permission", () => {
  assert.deepEqual(applyOverrides(["users.view", "users.delete"], ["reports.view"], ["users.delete"]).sort(), ["reports.view", "users.view"]);
});

