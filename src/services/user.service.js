const User = require("../models/User");

async function listUsers(query = {}) {
  const filter = { isActive: true };

  if (query.search) {
    filter.$or = [
      { name: new RegExp(query.search, "i") },
      { email: new RegExp(query.search, "i") }
    ];
  }

  return User.find(filter)
    .select("name email role lastSeenAt")
    .sort({ name: 1 })
    .limit(50);
}

module.exports = {
  listUsers
};

