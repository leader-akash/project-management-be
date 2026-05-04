const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { verifyToken } = require("../utils/jwt");

const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    throw new ApiError(401, "Authentication token is required.");
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (_error) {
    throw new ApiError(401, "Authentication token is invalid or expired.");
  }

  const user = await User.findById(payload.sub).select("+passwordHash");
  if (!user || !user.isActive) {
    throw new ApiError(401, "Authenticated user was not found.");
  }

  req.user = user;
  next();
});

const requireRole = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, "Your role does not allow this action."));
  }
  return next();
};

module.exports = {
  requireAuth,
  requireRole
};

