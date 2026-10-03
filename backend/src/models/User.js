const mongoose = require("mongoose");

const {
  USER_ROLES,
  USER_STATUS,
} = require("../constants/userConstants");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    role: {
      type: String,
      trim: true,
      lowercase: true,
      default: USER_ROLES.USER,
    },

    roles: {
      type: [String],
      default: undefined,
    },

    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
    },

    emailVerifiedAt: {
      type: Date,
      default: null,
    },

    permissionOverrides: {
      allow: {
        type: [String],
        default: [],
      },
      deny: {
        type: [String],
        default: [],
      },
    },

    authVersion: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

// IMPORTANT:
// Current Mongoose hook does not use callback `next`.
userSchema.pre("save", function () {
  if (!this.roles || !this.roles.length) {
    this.roles = [this.role || USER_ROLES.USER];
  }

  this.roles = [
    ...new Set(
      this.roles
        .map((r) => String(r).trim().toLowerCase())
        .filter(Boolean),
    ),
  ];

  this.role = this.roles[0] || USER_ROLES.USER;
});

module.exports = mongoose.model("User", userSchema);
