const bcrypt = require("bcryptjs");
const User = require("../models/User");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const { toTitleCase } = require("../utils/titleCase");
const { signToken } = require("../utils/jwt");

function publicUser(user) {
  const object = user.toObject ? user.toObject() : user;
  delete object.passwordHash;
  return object;
}

function resolveRegisterRole(email, requestedRole, isFirstUser) {
  const normalizedEmail = String(email || "").toLowerCase();
  if (isFirstUser) {
    return "admin";
  }
  if (env.COMPANY_ADMIN_EMAIL && normalizedEmail === env.COMPANY_ADMIN_EMAIL) {
    return "admin";
  }
  return requestedRole === "manager" ? "manager" : "member";
}

async function register(payload) {
  const existingUser = await User.findOne({ email: payload.email });
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists.");
  }

  const userCount = await User.countDocuments();
  const isFirstUser = userCount === 0;
  const passwordHash = await bcrypt.hash(payload.password, 12);
  const role = resolveRegisterRole(payload.email, payload.role, isFirstUser);
  const user = await User.create({
    name: toTitleCase(payload.name),
    email: payload.email,
    passwordHash,
    role
  });

  return {
    user: publicUser(user),
    token: signToken(user)
  };
}

async function login(payload) {
  const user = await User.findOne({ email: payload.email }).select("+passwordHash");
  if (!user || !user.isActive) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const matches = await user.comparePassword(payload.password);
  if (!matches) {
    throw new ApiError(401, "Invalid email or password.");
  }

  user.lastSeenAt = new Date();
  await user.save();

  return {
    user: publicUser(user),
    token: signToken(user)
  };
}

module.exports = {
  register,
  login,
  publicUser
};
