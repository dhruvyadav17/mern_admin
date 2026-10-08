const test = require("node:test");
const assert = require("node:assert/strict");

const User = require("../src/models/User");
const Role = require("../src/models/Role");
const userService = require("../src/services/userService");
const settingsService = require("../src/services/settingsService");
const { USER_ROLES, USER_STATUS } = require("../src/constants/userConstants");

const original = {
  userDb: User.db,
  findById: User.findById,
  findOne: User.findOne,
  find: User.find,
  countDocuments: User.countDocuments,
  deleteMany: User.deleteMany,
  updateMany: User.updateMany,
  roleExists: Role.exists,
  roleFind: Role.find,
  settingsGetValue: settingsService.getValue,
};


const makeUser = ({
  _id = "507f1f77bcf86cd799439011",
  roles = [USER_ROLES.USER],
  status = USER_STATUS.ACTIVE,
  authVersion = 0,
} = {}) => ({
  _id: { toString: () => _id },
  roles,
  status,
  authVersion,
  name: "Test User",
  email: `${_id}@example.com`,
  emailVerifiedAt: new Date(),
  save: async function save() {
    return this;
  },
  deleteOne: async function deleteOne() {},
});

const setupLock = () => {
  User.db = {
    collection: () => ({
      findOneAndUpdate: async (_filter, update) => ({
        owner: update.$set.owner,
      }),
      deleteOne: async () => ({}),
    }),
  };
};

const restore = () => {
  User.db = original.userDb;
  User.findById = original.findById;
  User.findOne = original.findOne;
  User.find = original.find;
  User.countDocuments = original.countDocuments;
  User.deleteMany = original.deleteMany;
  User.updateMany = original.updateMany;
  Role.exists = original.roleExists;
  Role.find = original.roleFind;
  settingsService.getValue = original.settingsGetValue;
};

test.beforeEach(() => {
  setupLock();
});

test.afterEach(() => {
  restore();
});

test("updateUser rejects changing the current user's own role", async () => {
  const user = makeUser({ _id: "507f1f77bcf86cd799439012", roles: [USER_ROLES.ADMIN] });
  User.findById = async () => user;

  await assert.rejects(
    () => userService.updateUser("507f1f77bcf86cd799439012", { roles: [USER_ROLES.USER] }, "507f1f77bcf86cd799439012"),
    { message: "You cannot change your own role or status" },
  );
});

test("updateUser rejects changing the current user's own status", async () => {
  const user = makeUser({ _id: "507f1f77bcf86cd799439012", roles: [USER_ROLES.ADMIN] });
  User.findById = async () => user;

  await assert.rejects(
    () => userService.updateUser("507f1f77bcf86cd799439012", { status: USER_STATUS.INACTIVE }, "507f1f77bcf86cd799439012"),
    { message: "You cannot change your own role or status" },
  );
});

test("updateUser prevents removing the last active admin role", async () => {
  const admin = makeUser({ _id: "507f1f77bcf86cd799439013", roles: [USER_ROLES.ADMIN] });
  User.findById = async () => admin;
  User.countDocuments = async (filter) => {
    assert.deepEqual(filter.roles, USER_ROLES.ADMIN);
    assert.equal(filter.status, USER_STATUS.ACTIVE);
    assert.deepEqual(filter._id, { $nin: [admin._id] });
    return 0;
  };
  Role.find = () => ({
    select: () => ({
      lean: async () => [{ name: USER_ROLES.USER }],
    }),
  });

  await assert.rejects(
    () => userService.updateUser("507f1f77bcf86cd799439013", { roles: [USER_ROLES.USER] }, "507f1f77bcf86cd799439014"),
    { message: "At least one active admin is required" },
  );
});

test("updateUser prevents suspending the last active admin", async () => {
  const admin = makeUser({ _id: "507f1f77bcf86cd799439013", roles: [USER_ROLES.ADMIN] });
  User.findById = async () => admin;
  User.countDocuments = async () => 0;

  await assert.rejects(
    () => userService.updateUser("507f1f77bcf86cd799439013", { status: USER_STATUS.SUSPENDED }, "507f1f77bcf86cd799439014"),
    { message: "At least one active admin is required" },
  );
});

test("updateUser increments authVersion for a password security change", async () => {
  const user = makeUser({ _id: "507f1f77bcf86cd799439011", authVersion: 7 });
  User.findById = async () => user;
  Role.exists = async () => true;

  const before = user.authVersion;
  await userService.updateUser("507f1f77bcf86cd799439011", { password: "new-password-123" }, "507f1f77bcf86cd799439014");

  assert.equal(user.authVersion, before + 1);
});

test("updateUser increments authVersion for an email security change", async () => {
  const user = makeUser({ _id: "507f1f77bcf86cd799439011", authVersion: 2 });
  User.findById = async () => user;
  User.findOne = () => ({
    select: () => ({
      lean: async () => null,
    }),
  });
  settingsService.getValue = async (_key, fallback) => fallback;

  const before = user.authVersion;
  await userService.updateUser("507f1f77bcf86cd799439011", { email: "new@example.com" }, "507f1f77bcf86cd799439014");

  assert.equal(user.authVersion, before + 1);
});

test("updateUser does not increment authVersion for a non-security profile change", async () => {
  const user = makeUser({ _id: "507f1f77bcf86cd799439011", authVersion: 4 });
  User.findById = async () => user;

  await userService.updateUser("507f1f77bcf86cd799439011", { name: "Updated Name" }, "507f1f77bcf86cd799439014");

  assert.equal(user.authVersion, 4);
});

test("deleteUser rejects deleting the current user's own account", async () => {
  const user = makeUser({ _id: "507f1f77bcf86cd799439012" });
  User.findById = async () => user;

  await assert.rejects(
    () => userService.deleteUser("507f1f77bcf86cd799439012", "507f1f77bcf86cd799439012"),
    { message: "You cannot delete your own account" },
  );
});

test("updateUserStatus increments authVersion only when status actually changes", async () => {
  const user = makeUser({ _id: "507f1f77bcf86cd799439011", authVersion: 5, status: USER_STATUS.ACTIVE });
  User.findById = async () => user;

  await userService.updateUserStatus("507f1f77bcf86cd799439011", USER_STATUS.ACTIVE, "507f1f77bcf86cd799439014");
  assert.equal(user.authVersion, 5);

  await userService.updateUserStatus("507f1f77bcf86cd799439011", USER_STATUS.INACTIVE, "507f1f77bcf86cd799439014");
  assert.equal(user.authVersion, 6);
  assert.equal(user.status, USER_STATUS.INACTIVE);
});
