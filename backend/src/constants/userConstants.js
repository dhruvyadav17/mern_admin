const USER_ROLES = {
    ADMIN: "admin",
    USER: "user"
};

const USER_STATUS = {
    ACTIVE: "active",
    INACTIVE: "inactive",
    SUSPENDED: "suspended"
};

const USER_ROLE_VALUES = Object.values(USER_ROLES);
const USER_STATUS_VALUES = Object.values(USER_STATUS);

module.exports = {
    USER_ROLES,
    USER_STATUS,
    USER_ROLE_VALUES,
    USER_STATUS_VALUES
};

