// DB-free tests for the passport photo studio (layout + crop logic; the ML model is not run here).
const request = require('supertest');
const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');
const app = require('../src/app');
const { buildSheet, suggestCrop, TEMPLATE, PHOTO_ASPECT } = require('../src/services/photoStudioService');

const samplePhoto = () => sharp({ create: { width: 300, height: 353, channels: 3, background: '#c08060' } }).jpeg().toBuffer();

describe('print sheet', () => {
  test('matches the template page (US Letter) and has 6 slots by default', async () => {
    const pdf = await PDFDocument.load(await buildSheet(await samplePhoto(), { copies: 6 }));
    const page = pdf.getPage(0);
    expect(pdf.getPageCount()).toBe(1);
    expect(page.getSize()).toEqual({ width: 612, height: 792 });
    expect(TEMPLATE.slotsX).toHaveLength(6);
  });
  test('A4 option uses A4 page size', async () => {
    const pdf = await PDFDocument.load(await buildSheet(await samplePhoto(), { copies: 8, paper: 'a4' }));
    const { width, height } = pdf.getPage(0).getSize();
    expect(Math.round(width)).toBe(595);
    expect(Math.round(height)).toBe(842);
  });
  test('rejects non-image data', async () => {
    await expect(buildSheet(Buffer.from('not an image'))).rejects.toThrow(/could not be read/);
  });
});

describe('crop suggestion', () => {
  test('centres on the head and keeps the passport aspect ratio', () => {
    const w = 400, h = 500, alpha = Buffer.alloc(w * h);
    for (let y = 40; y < 500; y++) {
      const half = y < 240 ? 80 : 190; // head, then shoulders
      for (let x = 210 - half; x < 210 + half; x++) alpha[y * w + x] = 255;
    }
    const c = suggestCrop(alpha, w, h);
    expect(c.found).toBe(true);
    expect(c.w / c.h).toBeCloseTo(PHOTO_ASPECT, 2);
    expect(c.x + c.w / 2).toBeGreaterThan(190);
    expect(c.x + c.w / 2).toBeLessThan(230);
    expect(c.y).toBeLessThanOrEqual(40);
  });
  test('falls back safely when nothing is found', () => {
    expect(suggestCrop(Buffer.alloc(100 * 100), 100, 100).found).toBe(false);
  });
});

describe('access control', () => {
  test('anonymous users cannot use the studio', async () => {
    expect((await request(app).post('/api/photo-studio/process')).status).toBe(401);
    expect((await request(app).post('/api/photo-studio/sheet')).status).toBe(401);
  });
});
