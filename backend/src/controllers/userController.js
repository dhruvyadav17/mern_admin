const userService = require("../services/userService");

const getUsers = async (req, res) => {
    const result = await userService.getUsers({
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search
    });

    return res.status(200).json({
        success: true,
        data: result.users,
        pagination: result.pagination
    });
};

const createUser = async (req, res) => {
    const user = await userService.createUser(
        req.body
    );

    return res.status(201).json({
        success: true,
        message: "User created successfully",
        data: user
    });
};

const getUserById = async (req, res) => {
    const user = await userService.getUserById(
        req.params.id
    );

    return res.status(200).json({
        success: true,
        data: user
    });
};

const updateUser = async (req, res) => {
    const user = await userService.updateUser(
        req.params.id,
        req.body
    );

    return res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: user
    });
};

const deleteUser = async (req, res) => {
    await userService.deleteUser(
        req.params.id,
        req.user._id
    );

    return res.status(200).json({
        success: true,
        message: "User deleted successfully"
    });
};

const updateUserStatus = async (req, res) => {
    const user =
        await userService.updateUserStatus(
            req.params.id,
            req.body.status,
            req.user._id
        );

    return res.status(200).json({
        success: true,
        message: `User ${req.body.status} successfully`,
        data: user
    });
};

module.exports = {
    getUsers,
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    updateUserStatus
};