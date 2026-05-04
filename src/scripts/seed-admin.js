/**
 * Creates a single workspace admin user (or promotes existing user by email).
 *
 * Usage:
 *   Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env, then:
 *   npm run seed:admin
 *
 * Optional: SEED_ADMIN_NAME (default: Workspace Admin)
 */

const bcrypt = require("bcryptjs");
const { connectDatabase, disconnectDatabase } = require("../config/database");
const User = require("../models/User");
const { toTitleCase } = require("../utils/titleCase");

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "";
  const name = toTitleCase((process.env.SEED_ADMIN_NAME || "Workspace Admin").trim());

  if (!email || !password) {
    console.error("Missing SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD. Add them to .env and run: npm run seed:admin");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("SEED_ADMIN_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  await connectDatabase();

  try {
    const existing = await User.findOne({ email }).select("+passwordHash");

    if (!existing) {
      const passwordHash = await bcrypt.hash(password, 12);
      await User.create({
        name,
        email,
        passwordHash,
        role: "admin",
        isActive: true
      });
      console.log(`Created admin: ${email}`);
      return;
    }

    if (existing.role === "admin") {
      console.log(`User already exists with admin role: ${email} (no changes).`);
      return;
    }

    existing.role = "admin";
    existing.name = name;
    existing.isActive = true;
    await existing.save();
    console.log(`Promoted existing user to admin: ${email}`);
  } finally {
    await disconnectDatabase();
  }
}

main().catch(async (err) => {
  console.error(err);
  try {
    await disconnectDatabase();
  } catch (_e) {
    // ignore
  }
  process.exit(1);
});
