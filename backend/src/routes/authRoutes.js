const express = require("express");

const {
    register,
    login,
    getMe,
    logout
} = require("../controllers/authController");

const {
    protect
} = require("../middleware/authMiddleware");

const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validateMiddleware");

const {
    registerValidation,
    loginValidation
} = require("../validators/authValidator");

const router = express.Router();

router.post(
    "/register",
    registerValidation,
    validate,
    asyncHandler(register)
);

router.post(
    "/login",
    loginValidation,
    validate,
    asyncHandler(login)
);

// router.get(
//     "/me",
//     protect,
//     asyncHandler(getMe)
// );

router.post(
    "/logout",
    asyncHandler(logout)
);

module.exports = router;