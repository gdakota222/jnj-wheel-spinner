// Generates the PWA icon set from code — no image dependencies.
// Run with: npm run icons
import { deflateSync, crc32 as nodeCrc32 } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { Buffer } from 'node:buffer';

// --- minimal PNG encoder -----------------------------------------------------
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  if (typeof nodeCrc32 === 'function') return nodeCrc32(buf) >>> 0;
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // colour type: RGBA
  ihdr[10] = 0;  // deflate
  ihdr[11] = 0;  // adaptive filtering
  ihdr[12] = 0;  // no interlace
  // one filter byte (0 = None) per scanline
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const o = y * (1 + width * 4);
    raw[o] = 0;
    rgba.copy(raw, o + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- the artwork -------------------------------------------------------------
const BG = [26, 20, 44, 255];        // deep indigo
const HUB = [255, 255, 255, 255];
const POINTER = [255, 255, 255, 255];
const SEGMENTS = [
  [255, 92, 122, 255],   // pink
  [255, 158, 66, 255],   // orange
  [255, 214, 74, 255],   // yellow
  [86, 204, 132, 255],   // green
  [72, 182, 220, 255],   // cyan
  [124, 122, 240, 255],  // indigo
  [199, 108, 226, 255],  // violet
  [255, 128, 171, 255],  // rose
];

const SS = 4; // supersampling factor per axis

function sample(px, py, size, wheelR) {
  const cx = size / 2;
  const cy = size / 2;
  const dx = px - cx;
  const dy = py - cy;
  const r = Math.hypot(dx, dy);

  // pointer: triangle above the wheel pointing inward
  const pw = size * 0.075;
  const pTop = cy - wheelR - size * 0.045;
  const pBot = cy - wheelR + size * 0.05;
  if (py >= pTop && py <= pBot) {
    const t = (py - pTop) / (pBot - pTop);
    if (Math.abs(dx) <= pw * (1 - t)) return POINTER;
  }

  if (r <= wheelR) {
    if (r <= wheelR * 0.17) return HUB;
    let a = Math.atan2(dy, dx) + Math.PI / 2;      // 0 at top
    if (a < 0) a += Math.PI * 2;
    const idx = Math.floor((a / (Math.PI * 2)) * SEGMENTS.length) % SEGMENTS.length;
    return SEGMENTS[idx];
  }
  return BG;
}

function render(size, { maskable = false } = {}) {
  // maskable icons must keep content inside the safe zone (centre ~80%)
  const wheelR = size * (maskable ? 0.32 : 0.40);
  const buf = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const c = sample(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS, size, wheelR);
          r += c[0]; g += c[1]; b += c[2]; a += c[3];
        }
      }
      const n = SS * SS;
      const o = (y * size + x) * 4;
      buf[o] = Math.round(r / n);
      buf[o + 1] = Math.round(g / n);
      buf[o + 2] = Math.round(b / n);
      buf[o + 3] = Math.round(a / n);
    }
  }
  return encodePng(size, size, buf);
}

mkdirSync('public', { recursive: true });
const outputs = [
  ['public/icon-192.png', render(192)],
  ['public/icon-512.png', render(512)],
  ['public/icon-maskable-512.png', render(512, { maskable: true })],
  ['public/apple-touch-icon.png', render(180)],
];
for (const [path, data] of outputs) {
  writeFileSync(path, data);
  console.log(`${path}  ${(data.length / 1024).toFixed(1)} KB`);
}
