const ApiError = require("../utils/ApiError");

const validate = (schemaByLocation) => (req, _res, next) => {
  try {
    for (const [location, schema] of Object.entries(schemaByLocation)) {
      const parsed = schema.parse(req[location]);
      req[location] = parsed;
    }
    next();
  } catch (error) {
    const details = error.issues?.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message
    }));
    const readableMessage = details?.length
      ? details.map((detail) => `${detail.field ? `${detail.field}: ` : ""}${detail.message}`).join(" ")
      : "Request validation failed.";
    next(new ApiError(400, readableMessage, details));
  }
};

module.exports = validate;
