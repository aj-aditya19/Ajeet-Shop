const env = require("./config/env");
const provider = require("./services/storage/cloudinaryProvider");

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

(async () => {
  console.log("Cloud name :", env.cloudinary.cloudName || "(MISSING)");
  console.log(
    "API key    :",
    env.cloudinary.apiKey
      ? env.cloudinary.apiKey.slice(0, 4) + "..."
      : "(MISSING)",
  );
  console.log("API secret :", env.cloudinary.apiSecret ? "set" : "(MISSING)");
  console.log("Provider   :", env.storageProvider);
  let id;
  try {
    const up = await provider.upload(PNG, { ext: "png" });
    id = up.storageId;
    console.log("1) UPLOAD OK  ->", up.storageUrl);
    const back = await provider.read({ storageId: id });
    console.log("2) READ OK    -> got", back.length, "bytes");
  } catch (e) {
    console.log("FAILED:", e.message || e);
  } finally {
    if (id) {
      await provider
        .remove(id)
        .then(() => console.log("3) CLEANUP OK"))
        .catch((e) => console.log("cleanup failed:", e.message));
    }
  }
})();
