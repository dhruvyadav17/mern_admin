const test = require("node:test");
const assert = require("node:assert/strict");
const { performance } = require("node:perf_hooks");
const { toUserListResponse } = require("../src/utils/userMapper");

test("1000-user list mapping stays lean and fast", () => {
  const users = Array.from({ length: 1000 }, (_, index) => ({
    _id: `user-${index}`,
    name: `User ${index}`,
    email: `user${index}@example.com`,
    roles: ["user"],
    status: "active",
    createdAt: new Date(2026, 0, 1 + (index % 28)),
    updatedAt: new Date(2026, 0, 1 + (index % 28)),
    avatar: "x".repeat(100_000),
    permissionOverrides: {
      allow: Array.from({ length: 50 }, (_, i) => `reports.${i}`),
      deny: Array.from({ length: 50 }, (_, i) => `admin.${i}`),
    },
  }));

  const started = performance.now();
  const result = toUserListResponse(users);
  const elapsed = performance.now() - started;

  assert.equal(result.length, 1000);
  assert.equal(result[0].avatar, undefined);
  assert.equal(result[0].permissionOverrides, undefined);
  assert.ok(elapsed < 250, `1000-user mapping took ${elapsed.toFixed(1)}ms`);
});
