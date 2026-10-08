const test = require("node:test");
const assert = require("node:assert/strict");

const { applyOverrides, hasPermission } = require("../src/utils/permissionLogic");

test("exact permission is granted and similar keys are not treated as matches", () => {
  assert.equal(hasPermission(["users.view"], "users.view"), true);
  assert.equal(hasPermission(["users.view"], "users.views"), false);
});

test("wildcard permission grants every requested permission", () => {
  assert.equal(hasPermission(["*"], "users.delete"), true);
  assert.equal(hasPermission(["*"], "settings.update"), true);
});

test("empty or missing permission lists deny access", () => {
  assert.equal(hasPermission([], "users.view"), false);
  assert.equal(hasPermission(undefined, "users.view"), false);
});

test("allow overrides add permissions without changing existing permissions", () => {
  assert.deepEqual(
    applyOverrides(["users.view"], ["users.edit"], []).sort(),
    ["users.edit", "users.view"],
  );
});

test("deny overrides remove permissions granted by roles", () => {
  assert.deepEqual(
    applyOverrides(["users.view", "users.delete"], [], ["users.delete"]),
    ["users.view"],
  );
});

test("deny overrides win when the same permission is both allowed and denied", () => {
  assert.deepEqual(
    applyOverrides(
      ["users.view"],
      ["users.delete", "users.edit"],
      ["users.delete"],
    ).sort(),
    ["users.edit", "users.view"],
  );
});

test("duplicate permissions collapse to one effective permission", () => {
  assert.deepEqual(
    applyOverrides(
      ["users.view", "users.view"],
      ["users.edit", "users.edit"],
      [],
    ).sort(),
    ["users.edit", "users.view"],
  );
});

test("deny and allow arrays default safely when omitted", () => {
  assert.deepEqual(applyOverrides(["users.view"]), ["users.view"]);
  assert.deepEqual(applyOverrides(), []);
});
