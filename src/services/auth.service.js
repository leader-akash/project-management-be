const bcrypt = require("bcryptjs");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { signToken } = require("../utils/jwt");

function publicUser(user) {
  const object = user.toObject ? user.toObject() : user;
  delete object.passwordHash;
  return object;
}

async function register(payload) {
  const existingUser = await User.findOne({ email: payload.email });
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);
  const user = await User.create({
    name: payload.name,
    email: payload.email,
    passwordHash,
    role: "member"
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
