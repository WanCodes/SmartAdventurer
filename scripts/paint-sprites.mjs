import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "sprites");
mkdirSync(root, { recursive: true });

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const out = Buffer.alloc(8 + body.length + 4);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), 8 + body.length);
  return out;
}

function png(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function hex(color) {
  const n = parseInt(color.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

function sheet() {
  const tile = 32;
  const width = tile * 8;
  const rgba = Buffer.alloc(width * tile * 4);
  const put = (x, y, color) => {
    if (x < 0 || y < 0 || x >= width || y >= tile) return;
    const [r, g, b, a] = hex(color);
    const i = (y * width + x) * 4;
    rgba[i] = r;
    rgba[i + 1] = g;
    rgba[i + 2] = b;
    rgba[i + 3] = a;
  };
  const block = (ox, color) => {
    for (let y = 0; y < tile; y += 1) {
      for (let x = 0; x < tile; x += 1) put(ox + x, y, color);
    }
  };
  block(0, "#7fbf63");
  block(32, "#d8c09a");
  block(64, "#4f92c4");
  block(96, "#3e6b48");
  block(128, "#f0e2c4");
  block(160, "#a33b32");
  block(192, "#8a5a32");
  block(224, "#e07a9a");
  return png(width, tile, rgba);
}

writeFileSync(join(root, "tiles.png"), sheet());
writeFileSync(join(root, "readme.txt"), "Generated tile sheet for Smart Adventurer. The game paints matching textures at runtime so colors stay in sync with customization.\n");
console.log("Painted public/sprites/tiles.png");
