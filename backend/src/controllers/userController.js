const userService = require("../services/userService");
const { successResponse } = require("../utils/response");

const getUsers = async (req, res) => {
    const result = await userService.getUsers({
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search
    });

    return successResponse(
        res,
        result.users,
        "Users fetched successfully",
        200,
        {
            pagination: result.pagination
        }
    );
};

const createUser = async (req, res) => {
    const user = await userService.createUser(
        req.body
    );

    return successResponse(res, user, "User created successfully", 201);
};

const getUserById = async (req, res) => {
    const user = await userService.getUserById(
        req.params.id
    );

    return successResponse(res, user, "User fetched successfully", 200);
};

const updateUser = async (req, res) => {
    const user = await userService.updateUser(
        req.params.id,
        req.body,
        req.user._id
    );

    return successResponse(res, user, "User updated successfully");
};

const deleteUser = async (req, res) => {
    await userService.deleteUser(
        req.params.id,
        req.user._id
    );

    return successResponse(res, null, "User deleted successfully");
};

const updateUserStatus = async (req, res) => {
    const user =
        await userService.updateUserStatus(
            req.params.id,
            req.body.status,
            req.user._id
        );

    return successResponse(res, user, `User ${req.body.status} successfully`);
};

module.exports = {
    getUsers,
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    updateUserStatus
};