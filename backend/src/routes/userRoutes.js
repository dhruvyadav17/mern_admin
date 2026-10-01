const express = require("express");

const {
    getUsers,
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    updateUserStatus
} = require("../controllers/userController");

const {
    protect,
    adminOnly
} = require("../middleware/authMiddleware");

const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validateMiddleware");

const {
    createUserValidation,
    updateUserValidation,
    updateUserStatusValidation
} = require("../validators/userValidator");

const router = express.Router();

router.get(
    "/",
    protect,
    adminOnly,
    asyncHandler(getUsers)
);

router.post(
    "/",
    protect,
    adminOnly,
    createUserValidation,
    validate,
    asyncHandler(createUser)
);

router.get(
    "/:id",
    protect,
    adminOnly,
    asyncHandler(getUserById)
);

router.put(
    "/:id",
    protect,
    adminOnly,
    updateUserValidation,
    validate,
    asyncHandler(updateUser)
);

router.delete(
    "/:id",
    protect,
    adminOnly,
    asyncHandler(deleteUser)
);

router.patch(
    "/:id/status",
    protect,
    adminOnly,
    updateUserStatusValidation,
    validate,
    asyncHandler(updateUserStatus)
);

module.exports = router;