const toUserResponse = (user) => {
    if (!user) return null;

    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
};

const toUserListResponse = (users) => users.map(toUserResponse);

module.exports = {
    toUserResponse,
    toUserListResponse
};
