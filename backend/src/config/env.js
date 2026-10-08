require("dotenv").config();
process.env.TZ = process.env.TZ || "Asia/Kolkata";

const cloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET,
);

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProd: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,
  clientUrls: (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim()),
  storageProvider:
    process.env.STORAGE_PROVIDER ||
    (cloudinaryConfigured ? "cloudinary" : "local"),
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB) || 10,
  maxFiles: Number(process.env.MAX_FILES_PER_REQUEST) || 5,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || process.env.SHOP_EMAIL,
  },
  alerts: {
    overdueEveryHours: Number(process.env.OVERDUE_ALERT_EVERY_HOURS) || 6,
    adminEmail:
      process.env.ADMIN_ALERT_EMAIL ||
      process.env.SHOP_EMAIL ||
      "ajeetjayswal71@gmail.com",
  },
  business: {
    name: "Ajeet Digital Services",
    cateringName: "Ajeet Catering Services",
    owner: "Ajeet Kumar Jaiswal",
    address: [
      "Front of Tons Food Park",
      "Nanda Ki Chowki",
      "Sudhowala",
      "Dehradun",
      "Uttarakhand - 248007",
    ],
    whatsapp: process.env.SHOP_WHATSAPP_NUMBER || "9458344385",
    phones: [
      process.env.SHOP_PHONE_1 || "9458344385",
      process.env.SHOP_PHONE_2 || "7456067529",
    ],
    email: process.env.SHOP_EMAIL || "ajeetjayswal71@gmail.com",
    mapsUrl: process.env.MAPS_URL || "",
  },
};

module.exports = env;
