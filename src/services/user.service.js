const User = require("../models/User");

async function listUsers(query = {}) {
  const filter = { isActive: true };

  if (query.search) {
    filter.$or = [
      { name: new RegExp(query.search, "i") },
      { email: new RegExp(query.search, "i") }
    ];
  }

  const rawLimit = Number.parseInt(String(query.limit ?? ""), 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 500) : 200;

  return User.find(filter)
    .select("name email role lastSeenAt")
    .sort({ name: 1 })
    .limit(limit);
}

module.exports = {
  listUsers
};

