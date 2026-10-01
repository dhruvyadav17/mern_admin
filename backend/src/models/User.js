const mongoose = require("mongoose");
const {
    USER_ROLES,
    USER_STATUS
} = require("../constants/userConstants");
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            //minlength: 6
        },

        role: {
            type: String,
            enum: USER_ROLES,
            default: USER_ROLES.USER
        },

        status: {
            type: String,
            enum: USER_STATUS,
            default: USER_STATUS.ACTIVE
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);