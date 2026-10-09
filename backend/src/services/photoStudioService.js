const sharp = require("sharp");
const { PDFDocument, rgb } = require("pdf-lib");
const ApiError = require("../utils/ApiError");
const { createLock } = require("../utils/mutex");

const imageJobLock = createLock();

const TEMPLATE = {
  pageW: 612,
  pageH: 792,
  slotsX: [39.84, 127.68, 215.52, 303.36, 391.32, 479.16],
  frameW: 83.16,
  frameH: 97.44,
  imgInset: [0.84, 0.96],
  imgW: 81.36,
  imgH: 95.52,
  topMargin: 7.2,
  rowPitch: 104.4,
  border: 0.48,
};
const PHOTO_ASPECT = 264 / 311;
const OUT_W = 600;
const OUT_H = Math.round(OUT_W / PHOTO_ASPECT);
const A4 = { w: 595.28, h: 841.89 };

let bgLib;
const bg = () => bgLib || (bgLib = require("@imgly/background-removal-node"));

function suggestCrop(alpha, w, h) {
  const thr = 128;
  const count = new Int32Array(h);
  const sumX = new Float64Array(h);
  for (let y = 0; y < h; y++) {
    let c = 0,
      s = 0;
    for (let x = 0; x < w; x++)
      if (alpha[y * w + x] > thr) {
        c++;
        s += x;
      }
    count[y] = c;
    sumX[y] = s;
  }
  const minRun = Math.max(3, Math.round(w * 0.02));
  let top = -1,
    bottom = -1;
  for (let y = 0; y < h - 4; y++)
    if (
      count[y] >= minRun &&
      count[y + 2] >= minRun &&
      count[y + 4] >= minRun
    ) {
      top = y;
      break;
    }
  for (let y = h - 1; y >= 0; y--)
    if (count[y] >= minRun) {
      bottom = y;
      break;
    }
  if (top < 0 || bottom <= top)
    return {
      x: 0,
      y: 0,
      w: Math.min(w, h * PHOTO_ASPECT),
      h: Math.min(h, w / PHOTO_ASPECT),
      found: false,
    };

  const subjH = bottom - top + 1;
  const headEnd = Math.min(h - 1, top + Math.round(subjH * 0.4));
  const widths = [];
  let sx = 0,
    sc = 0;
  for (let y = top; y <= headEnd; y++) {
    widths.push(count[y]);
    sx += sumX[y];
    sc += count[y];
  }
  widths.sort((a, b) => a - b);
  const headWidth =
    widths[Math.floor(widths.length * 0.9)] || widths[widths.length - 1];
  const cx = sc ? sx / sc : w / 2;

  let W = headWidth / 0.52;
  let H = W / PHOTO_ASPECT;
  if (H > h) {
    H = h;
    W = H * PHOTO_ASPECT;
  }
  if (W > w) {
    W = w;
    H = W / PHOTO_ASPECT;
  }
  let y = Math.min(Math.max(0, top - 0.06 * H), h - H);
  let x = Math.min(Math.max(0, cx - W / 2), w - W);
  return { x, y, w: W, h: H, found: true };
}

function enhance(rgba, w, h, { face, strength = 0.6 } = {}) {
  const out = Buffer.from(rgba);
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const gains = [1, 1, 1];
  if (face) {
    let r = 0,
      g = 0,
      b = 0,
      n = 0;
    for (
      let y = Math.max(0, Math.floor(face.y0));
      y < Math.min(h, Math.ceil(face.y1));
      y++
    ) {
      for (
        let x = Math.max(0, Math.floor(face.x0));
        x < Math.min(w, Math.ceil(face.x1));
        x++
      ) {
        const i = (y * w + x) * 4;
        if (rgba[i + 3] < 200) continue;
        const lum = 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
        if (lum < 70 || lum > 235) continue;
        r += rgba[i];
        g += rgba[i + 1];
        b += rgba[i + 2];
        n++;
      }
    }
    if (n > 200 && r > 0) {
      const gr = g / r,
        br = b / r;
      const mx = Math.max(r, g, b),
        mn = Math.min(r, g, b);
      let hue = 0;
      if (mx !== mn) {
        const d = mx - mn;
        hue =
          mx === r
            ? ((g - b) / d) % 6
            : mx === g
              ? (b - r) / d + 2
              : (r - g) / d + 4;
        hue = (hue * 60 + 360) % 360;
      }
      if (hue < 8 || hue > 48) {
        gains[1] = clamp(1 + 0.6 * (0.74 / gr - 1), 0.5, 2.2);
        gains[2] = clamp(1 + 0.6 * (0.58 / br - 1), 0.35, 2);
      }
    }
  }
  const balanced = Buffer.from(rgba);
  for (let i = 0; i < w * h; i++)
    for (let c = 1; c < 3; c++)
      balanced[i * 4 + c] = clamp(
        Math.round(rgba[i * 4 + c] * gains[c]),
        0,
        255,
      );

  const hist = [
    new Uint32Array(256),
    new Uint32Array(256),
    new Uint32Array(256),
  ];
  let n = 0,
    lumSum = 0;
  for (let i = 0; i < w * h; i++) {
    if (balanced[i * 4 + 3] < 200) continue;
    n++;
    for (let c = 0; c < 3; c++) hist[c][balanced[i * 4 + c]]++;
    lumSum +=
      0.299 * balanced[i * 4] +
      0.587 * balanced[i * 4 + 1] +
      0.114 * balanced[i * 4 + 2];
  }
  if (n < 100) return balanced;
  const pct = (hst, p) => {
    let a = 0;
    const t = n * p;
    for (let v = 0; v < 256; v++) {
      a += hst[v];
      if (a >= t) return v;
    }
    return 255;
  };
  const lo = [0, 1, 2].map((c) => pct(hist[c], 0.01));
  const hi = [0, 1, 2].map((c) => pct(hist[c], 0.995));
  const meanLum = lumSum / n;
  const gamma = meanLum < 110 ? 0.85 : meanLum > 170 ? 1.1 : 1;
  for (let i = 0; i < w * h; i++) {
    for (let c = 0; c < 3; c++) {
      const v = balanced[i * 4 + c];
      const span = Math.max(40, hi[c] - lo[c]);
      let s = clamp(((v - lo[c]) / span) * 255, 0, 255);
      s = 255 * Math.pow(s / 255, gamma);
      out[i * 4 + c] = Math.round(v * (1 - strength) + s * strength);
    }
  }
  return out;
}

async function refineAlpha(rgba, w, h) {
  const alpha = Buffer.alloc(w * h);
  for (let i = 0; i < w * h; i++) alpha[i] = rgba[i * 4 + 3];
  const { data: blurred, info } = await sharp(alpha, {
    raw: { width: w, height: h, channels: 1 },
  })
    .blur(1.1)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const stride = info.channels;
  const out = Buffer.from(rgba);
  for (let i = 0; i < w * h; i++) {
    const a = blurred[i * stride] / 255;
    const k = Math.min(1, Math.max(0, (a - 0.5) * 1.8 + 0.5));
    out[i * 4 + 3] = Math.round(k * 255);
  }
  return out;
}

const toPng = (rgba, w, h) =>
  sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 6 })
    .toBuffer();
const dataUrl = (buf) => `data:image/png;base64,${buf.toString("base64")}`;

async function processPhoto(
  buffer,
  { model = process.env.PHOTO_MODEL || "medium" } = {},
) {
  return imageJobLock(async () => {
    let prepared;
    let upscaled = false;
    try {
      let pipe = sharp(buffer, { failOn: "none" })
        .rotate()
        .flatten({ background: "#ffffff" });
      const meta = await pipe.clone().toBuffer({ resolveWithObject: true });
      const longest = Math.max(meta.info.width, meta.info.height);
      const scale =
        longest < 1000
          ? Math.min(2, 1000 / longest)
          : Math.min(1, 1600 / longest);
      pipe = sharp(meta.data);
      upscaled = scale > 1.3;
      if (Math.abs(scale - 1) > 0.05)
        pipe = pipe.resize({
          width: Math.round(meta.info.width * scale),
          kernel: "lanczos3",
        });
      prepared = await pipe.jpeg({ quality: 95 }).toBuffer();
    } catch {
      throw new ApiError(
        422,
        "This file is not a readable image. Use a JPG, PNG or WebP photo.",
      );
    }

    let cut;
    try {
      const blob = await bg().removeBackground(
        new Blob([prepared], { type: "image/jpeg" }),
        { model, output: { format: "image/png" } },
      );
      cut = Buffer.from(await blob.arrayBuffer());
    } catch (err) {
      throw new ApiError(500, `Background removal failed: ${err.message}`);
    }

    const { data, info } = await sharp(cut)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = info;
    const refined = await refineAlpha(data, w, h);
    const alpha = Buffer.alloc(w * h);
    for (let i = 0; i < w * h; i++) alpha[i] = refined[i * 4 + 3];
    const crop = suggestCrop(alpha, w, h);

    let colour = refined;
    if (upscaled) {
      const rgb = Buffer.alloc(w * h * 3);
      for (let i = 0; i < w * h; i++) {
        rgb[i * 3] = refined[i * 4];
        rgb[i * 3 + 1] = refined[i * 4 + 1];
        rgb[i * 3 + 2] = refined[i * 4 + 2];
      }
      const sm = await sharp(rgb, { raw: { width: w, height: h, channels: 3 } })
        .convolve({
          width: 3,
          height: 9,
          kernel: [1, 8, 28, 56, 70, 56, 28, 8, 1].flatMap((v) => [0, v, 0]),
          scale: 256,
        })
        .median(3)
        .blur(0.5)
        .raw()
        .toBuffer();
      colour = Buffer.from(refined);
      for (let i = 0; i < w * h; i++) {
        colour[i * 4] = sm[i * 3];
        colour[i * 4 + 1] = sm[i * 3 + 1];
        colour[i * 4 + 2] = sm[i * 3 + 2];
      }
    }
    const cxm = crop.x + crop.w / 2;
    const face = {
      x0: cxm - 0.16 * crop.w,
      x1: cxm + 0.16 * crop.w,
      y0: crop.y + 0.3 * crop.h,
      y1: crop.y + 0.52 * crop.h,
    };

    const [enhancedPng, plainPng] = await Promise.all([
      toPng(enhance(colour, w, h, { face }), w, h),
      toPng(refined, w, h),
    ]);
    return {
      width: w,
      height: h,
      aspect: PHOTO_ASPECT,
      outWidth: OUT_W,
      outHeight: OUT_H,
      crop,
      enhanced: dataUrl(enhancedPng),
      plain: dataUrl(plainPng),
    };
  });
}

// ---------- A4/Letter print sheet ----------
async function buildSheet(imageBuffer, { copies = 6, paper = "letter" } = {}) {
  let jpeg;
  try {
    jpeg = await sharp(imageBuffer, { failOn: "none" })
      .rotate()
      .flatten({ background: "#ffffff" })
      .resize({ width: OUT_W, height: OUT_H, fit: "cover", position: "centre" })
      .jpeg({ quality: 93, chromaSubsampling: "4:4:4" })
      .toBuffer();
  } catch {
    throw new ApiError(422, "Photo could not be read");
  }
  const T = TEMPLATE;
  const pageW = paper === "a4" ? A4.w : T.pageW;
  const pageH = paper === "a4" ? A4.h : T.pageH;
  const shiftX = (pageW - T.pageW) / 2;

  const pdf = await PDFDocument.create();
  pdf.setTitle("Passport photo sheet");
  pdf.setProducer("Ajeet Digital Services");
  const page = pdf.addPage([pageW, pageH]);
  const img = await pdf.embedJpg(jpeg);
  const perRow = T.slotsX.length;
  const total = Math.min(Math.max(1, copies), perRow * 7);
  for (let i = 0; i < total; i++) {
    const row = Math.floor(i / perRow),
      col = i % perRow;
    const fx = T.slotsX[col] + shiftX;
    const fyTop = T.topMargin + row * T.rowPitch;
    page.drawImage(img, {
      x: fx + T.imgInset[0],
      y: pageH - (fyTop + T.imgInset[1]) - T.imgH,
      width: T.imgW,
      height: T.imgH,
    });
    const b = T.border;
    page.drawRectangle({
      x: fx + b / 2,
      y: pageH - (fyTop + T.frameH) + b / 2,
      width: T.frameW - b,
      height: T.frameH - b,
      borderColor: rgb(0, 0, 0),
      borderWidth: b,
    });
  }
  return Buffer.from(await pdf.save());
}

module.exports = {
  processPhoto,
  buildSheet,
  suggestCrop,
  enhance,
  TEMPLATE,
  PHOTO_ASPECT,
  OUT_W,
  OUT_H,
};
