const { validationResult } = require("express-validator");

const validate = (req, res, next) => {
    const result = validationResult(req);

    if (!result.isEmpty()) {
        const errors = result.array();

        return res.status(400).json({
            success: false,
            message: errors[0].msg,
            errors
        });
    }

    next();
};

module.exports = validate;
