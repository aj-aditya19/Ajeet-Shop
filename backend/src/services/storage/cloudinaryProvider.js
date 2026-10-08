const env = require('../../config/env');

let cloudinary;
function client() {
  if (!cloudinary) {
    cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: env.cloudinary.cloudName,
      api_key: env.cloudinary.apiKey,
      api_secret: env.cloudinary.apiSecret,
      secure: true,
    });
  }
  return cloudinary;
}

// Files are uploaded with type "authenticated": no public URL works, only signed URLs generated here.
// storageId = "<resource_type>|<public_id>|<format>"
module.exports = {
  name: 'cloudinary',
  async upload(buffer, { ext }) {
    const c = client();
    const result = await new Promise((resolve, reject) => {
      c.uploader
        .upload_stream({ folder: 'ajeet-digital/requests', resource_type: 'auto', type: 'authenticated' }, (err, r) =>
          err ? reject(err) : resolve(r)
        )
        .end(buffer);
    });
    const storageId = [result.resource_type, result.public_id, result.format || ''].join('|');
    return { storageId, storageUrl: result.secure_url };
  },
  async read(file) {
    const [resourceType, publicId, format] = file.storageId.split('|');
    const c = client();
    // 1) Admin-API download URL: signed with the API secret, not affected by Cloudinary's
    //    "restricted media types" delivery settings (which block PDFs by default).
    // 2) Fallback: signed delivery URL.
    const urls = [
      () => c.utils.private_download_url(publicId, format || '', { resource_type: resourceType, type: 'authenticated', expires_at: Math.floor(Date.now() / 1000) + 300 }),
      () => c.url(publicId, { resource_type: resourceType, type: 'authenticated', sign_url: true, secure: true, format: format || undefined }),
    ];
    let lastStatus;
    for (const makeUrl of urls) {
      try {
        const res = await fetch(makeUrl());
        if (res.ok) return Buffer.from(await res.arrayBuffer());
        lastStatus = res.status;
      } catch (err) {
        lastStatus = err.message;
      }
    }
    throw new Error(`Storage fetch failed (${lastStatus}). Check Cloudinary credentials and Settings > Security > "PDF and ZIP files delivery".`);
  },
  async remove(storageId) {
    const [resourceType, publicId] = storageId.split('|');
    await client().uploader.destroy(publicId, { resource_type: resourceType, type: 'authenticated' });
  },
};
