const mongoose = require("mongoose");

const { USER_ROLES, USER_STATUS } = require("../constants/userConstants");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    avatar: {
      type: String,
      default: null,
      maxlength: 700000,
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

userSchema.index({ createdAt: -1, _id: -1 });

userSchema.pre("save", function () {
  if (!this.roles || !this.roles.length) {
    this.roles = [USER_ROLES.USER];
  }

  this.roles = [
    ...new Set(
      this.roles.map((r) => String(r).trim().toLowerCase()).filter(Boolean),
    ),
  ];
});

module.exports = mongoose.model("User", userSchema);
