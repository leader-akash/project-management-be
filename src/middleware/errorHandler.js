const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");

function normalizeError(error) {
  if (error instanceof ApiError) return error;

  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.values(error.errors).map((entry) => ({
      field: entry.path,
      message: entry.message
    }));
    return new ApiError(400, "Validation failed.", details);
  }

  if (error?.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || "field";
    return new ApiError(409, `${field} already exists.`);
  }

  if (error instanceof mongoose.Error.CastError) {
    return new ApiError(400, `Invalid ${error.path}.`);
  }

  return new ApiError(500, "An unexpected server error occurred.");
}

function errorHandler(error, _req, res, _next) {
  const normalized = normalizeError(error);

  if (normalized.statusCode >= 500) {
    console.error(error);
  }

  res.status(normalized.statusCode).json({
    message: normalized.message,
    details: normalized.details
  });
}

module.exports = errorHandler;

