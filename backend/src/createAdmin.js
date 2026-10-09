const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const env = require("./config/env");
const { connectDB } = require("./config/db");
const User = require("./models/User");

(async () => {
  try {
    const [name, emailRaw, password] = process.argv.slice(2);
    if (!name || !emailRaw || !password)
      throw new Error(
        'Usage: npm run create-admin -- "Name" email@example.com "Password"',
      );
    if (password.length < 8)
      throw new Error("Password must be at least 8 characters");
    const email = emailRaw.toLowerCase().trim();
    await connectDB();
    const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
    const existing = await User.findOne({ email });
    if (existing && existing.role !== "admin")
      throw new Error(
        "This email is already used by a customer account. Use a different email.",
      );
    if (existing) {
      existing.passwordHash = passwordHash;
      existing.name = name;
      await existing.save();
      console.log(`Password updated for admin: ${email}`);
    } else {
      await User.create({
        name,
        email,
        phone: env.business.phones[0],
        passwordHash,
        role: "admin",
      });
      console.log(`Admin created: ${email}`);
    }
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
