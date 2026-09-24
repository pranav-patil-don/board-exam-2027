import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  // RGBA buffer: height rows, width * 4 bytes each, plus 1 filter byte (0) per row
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      let byte = buf[i];
      for (let j = 0; j < 8; j++) {
        if ((crc ^ byte) & 1) {
          crc = (crc >>> 1) ^ 0xedb88320;
        } else {
          crc = crc >>> 1;
        }
        byte = byte >>> 1;
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crcVal = crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crcVal, 8 + len);
    return buf;
  }

  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

// Icon generator with RPG shield, neon cyber borders, and gold star
function drawIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const scale = w / 512;

  // Maskable requires safe zone in 80% circle
  const safeMargin = isMaskable ? 0.75 : 0.9;
  const nx = (x - cx) / (w / 2 * safeMargin);
  const ny = (y - cy) / (h / 2 * safeMargin);

  // Background dark cyber slate
  let r = 11, g = 15, b = 25, a = 255;

  // Background radial ambient glow
  const distCenter = Math.sqrt(nx * nx + ny * ny);
  if (distCenter < 1.0) {
    const ambient = Math.max(0, 1 - distCenter);
    r = Math.floor(r + 20 * ambient);
    g = Math.floor(g + 25 * ambient);
    b = Math.floor(b + 50 * ambient);
  }

  // Shield boundary calculation (parametric shield)
  // Normalized coordinates: -1 <= nx <= 1, -1 <= ny <= 1
  // Top: curved top, Sides: down to ny = 0.2, then tapers to (0, 0.95)
  let inShield = false;
  let onShieldBorder = false;

  const sy = ny + 0.1;
  const sx = Math.abs(nx);

  if (sy >= -0.75 && sy <= 0.9) {
    let maxWidth = 0;
    if (sy < 0.1) {
      maxWidth = 0.72 - 0.12 * Math.pow(sy + 0.75, 2);
    } else {
      // tapering to bottom
      const t = (sy - 0.1) / 0.8;
      maxWidth = 0.72 * (1 - Math.pow(t, 1.4));
    }

    if (sx <= maxWidth) {
      inShield = true;
      if (maxWidth - sx < 0.08) {
        onShieldBorder = true;
      }
    }
  }

  if (onShieldBorder) {
    // Neon gradient border: Cyan #06b6d4 to Purple #a855f7
    const gradT = (ny + 1) / 2;
    r = Math.floor(6 + gradT * (168 - 6));
    g = Math.floor(182 - gradT * (182 - 85));
    b = Math.floor(212 + gradT * (247 - 212));
  } else if (inShield) {
    // Shield interior: Deep Indigo
    r = 20; g = 25; b = 48;

    // Central CBSE Star
    // 5-pointed star
    const starAngle = Math.atan2(ny + 0.05, nx);
    const starDist = Math.sqrt(nx * nx + (ny + 0.05) * (ny + 0.05));
    const starR = 0.28;
    const innerR = 0.13;
    // 5 points
    const aNorm = ((starAngle + Math.PI * 0.5) % (Math.PI * 2 / 5) + Math.PI * 2 / 5) % (Math.PI * 2 / 5);
    const step = Math.PI / 5;
    const starBoundary = (aNorm < step) 
      ? innerR + (starR - innerR) * (1 - aNorm / step)
      : innerR + (starR - innerR) * ((aNorm - step) / step);

    if (starDist < starBoundary) {
      // Golden yellow gradient
      const sT = Math.max(0, 1 - starDist / starR);
      r = Math.floor(250 * sT + 234 * (1 - sT));
      g = Math.floor(204 * sT + 179 * (1 - sT));
      b = Math.floor(21 * sT + 8 * (1 - sT));
    } else if (starDist < starBoundary + 0.03) {
      // Star glow
      r = 254; g = 240; b = 138;
    } else if (ny > 0.28 && ny < 0.55 && sx < 0.4) {
      // Open Book representation
      r = 56; g = 189; b = 248; // Cyan lines
    }
  }

  // Rounded outer canvas (if not maskable)
  if (!isMaskable) {
    const cornerR = 0.88;
    const dx = Math.max(0, Math.abs(x - cx) - (w * 0.5 - w * 0.2));
    const dy = Math.max(0, Math.abs(y - cy) - (h * 0.5 - h * 0.2));
    if (Math.sqrt(dx * dx + dy * dy) > w * 0.2) {
      a = 0; // transparent corner
    }
  }

  return [r, g, b, a];
}

console.log('Generating PNG icons...');
fs.writeFileSync('public/pwa-192x192.png', createPNG(192, 192, (x, y, w, h) => drawIcon(x, y, w, h, false)));
fs.writeFileSync('public/pwa-512x512.png', createPNG(512, 512, (x, y, w, h) => drawIcon(x, y, w, h, false)));
fs.writeFileSync('public/pwa-maskable-512x512.png', createPNG(512, 512, (x, y, w, h) => drawIcon(x, y, w, h, true)));
fs.writeFileSync('public/apple-touch-icon.png', createPNG(180, 180, (x, y, w, h) => drawIcon(x, y, w, h, false)));
fs.writeFileSync('public/favicon.ico', createPNG(64, 64, (x, y, w, h) => drawIcon(x, y, w, h, false)));
console.log('Icons generated successfully!');
