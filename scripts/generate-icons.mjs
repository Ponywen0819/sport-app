// 純 Node.js 生成 PWA icon PNG（不需要外部依賴）
import { deflateSync } from "zlib";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// CRC32 表
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const lenBuf = Buffer.allocUnsafe(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
}

function makePng(size) {
  // ──────────────────────────────────────
  // 設計：深色背景 + 啞鈴圖示（圓弧 + 槓）
  // ──────────────────────────────────────
  const BG   = [28,  25,  23];   // #1c1917 stone-900
  const ICON = [52, 211, 153];   // #34d399 emerald-400

  const pixels = new Uint8Array(size * size * 3).fill(0);

  const set = (x, y, [r, g, b]) => {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const i = (y * size + x) * 3;
    pixels[i] = r; pixels[i + 1] = g; pixels[i + 2] = b;
  };

  // 背景
  for (let i = 0; i < pixels.length; i += 3) {
    pixels[i] = BG[0]; pixels[i + 1] = BG[1]; pixels[i + 2] = BG[2];
  }

  // 圓角背景框（比整體小一點）
  const margin = Math.round(size * 0.12);
  const radius = Math.round(size * 0.22);
  const fillColor = [40, 37, 35]; // 稍微亮一點的背景
  const boxX1 = margin, boxY1 = margin;
  const boxX2 = size - margin, boxY2 = size - margin;

  for (let y = boxY1; y < boxY2; y++) {
    for (let x = boxX1; x < boxX2; x++) {
      const dx1 = Math.max(0, boxX1 + radius - x);
      const dy1 = Math.max(0, boxY1 + radius - y);
      const dx2 = Math.max(0, x - (boxX2 - radius));
      const dy2 = Math.max(0, y - (boxY2 - radius));
      const dist = Math.sqrt(
        Math.max(dx1, dx2) ** 2 + Math.max(dy1, dy2) ** 2
      );
      if (dist <= radius) set(x, y, fillColor);
    }
  }

  // 啞鈴繪製
  const cx = size / 2;
  const cy = size / 2;

  // 槓（水平橫桿）
  const barW = size * 0.36;
  const barH = size * 0.065;
  for (let y = Math.round(cy - barH / 2); y <= Math.round(cy + barH / 2); y++) {
    for (let x = Math.round(cx - barW); x <= Math.round(cx + barW); x++) {
      set(x, y, ICON);
    }
  }

  // 左側圓盤
  const diskW = size * 0.095;
  const diskH = size * 0.22;
  for (let y = Math.round(cy - diskH); y <= Math.round(cy + diskH); y++) {
    for (let x = Math.round(cx - barW - diskW); x <= Math.round(cx - barW + diskW); x++) {
      const rx = Math.abs(x - (cx - barW)) / diskW;
      const ry = Math.abs(y - cy) / diskH;
      if (rx * rx + ry * ry <= 1) set(x, y, ICON);
    }
  }

  // 右側圓盤
  for (let y = Math.round(cy - diskH); y <= Math.round(cy + diskH); y++) {
    for (let x = Math.round(cx + barW - diskW); x <= Math.round(cx + barW + diskW); x++) {
      const rx = Math.abs(x - (cx + barW)) / diskW;
      const ry = Math.abs(y - cy) / diskH;
      if (rx * rx + ry * ry <= 1) set(x, y, ICON);
    }
  }

  // 組裝 PNG
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // 加 filter byte（0 = None）到每行頭
  const rawRows = Buffer.allocUnsafe(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    rawRows[y * (size * 3 + 1)] = 0;
    pixels.copy
      ? Buffer.from(pixels).copy(rawRows, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3)
      : Buffer.from(pixels.buffer, y * size * 3, size * 3).copy(rawRows, y * (size * 3 + 1) + 1);
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(rawRows, { level: 6 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outDir = join(__dirname, "../public");
writeFileSync(join(outDir, "icon-192.png"), makePng(192));
writeFileSync(join(outDir, "icon-512.png"), makePng(512));
console.log("✅ icon-192.png 和 icon-512.png 已生成到 public/");
