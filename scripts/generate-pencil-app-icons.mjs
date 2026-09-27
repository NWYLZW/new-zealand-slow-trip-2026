import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const server = await createServer({ root, configFile: false, appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] }, server: { host: '127.0.0.1', port: 0 } });
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.route('**/app-icon-renderer', route => route.fulfill({
    contentType: 'text/html', body: '<!doctype html><title>App icon renderer</title>',
  }));
  await page.goto(`${server.resolvedUrls.local[0]}app-icon-renderer`);
  const icons = await page.evaluate(async () => {
    const { drawFavicon } = await import('/scripts/lib/pencil-favicon.js');
    return [
      { filename: 'pencil-app-192.png', size: 192 },
      { filename: 'pencil-app-512.png', size: 512 },
      { filename: 'pencil-app-maskable-512.png', size: 512, maskable: true },
      { filename: 'pencil-apple-touch-icon.png', size: 180 },
    ].map(({ filename, size, maskable = false }) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      // The platform may crop everything outside its central 40%-radius circle.
      const artworkSize = maskable ? size * .75 : size;
      const inset = (size - artworkSize) / 2;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(drawFavicon(size), inset, inset, artworkSize, artworkSize);
      const pixels = ctx.getImageData(0, 0, size, size).data;
      let transparent = 0, edgeInk = 0, ink = 0, red = 0, outsideSafeZone = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const pixel = i / 4, x = pixel % size, y = Math.floor(pixel / size);
        const colored = pixels[i] !== 255 || pixels[i + 1] !== 255 || pixels[i + 2] !== 255;
        if (pixels[i + 3] !== 255) transparent++;
        if (colored && (!x || !y || x === size - 1 || y === size - 1)) edgeInk++;
        if (pixels[i + 1] < 160) ink++;
        if (pixels[i] > pixels[i + 1] * 1.2) red++;
        if (colored && Math.hypot(x + .5 - size / 2, y + .5 - size / 2) > size * .4) outsideSafeZone++;
      }
      return { filename, size, maskable, transparent, edgeInk, ink, red, outsideSafeZone,
        data: canvas.toDataURL('image/png').split(',')[1] };
    });
  });
  const output = new URL('../public/icons/', import.meta.url);
  await mkdir(output, { recursive: true });
  for (const icon of icons) {
    assert.equal(icon.transparent, 0, `${icon.filename}: background must be opaque`);
    assert.equal(icon.edgeInk, 0, `${icon.filename}: edges must be pure white`);
    assert(icon.ink > icon.size * icon.size * .05 && icon.red > 0, `${icon.filename}: missing artwork`);
    if (icon.maskable) assert.equal(icon.outsideSafeZone, 0, 'Maskable artwork exceeds the safe circle');
    const png = Buffer.from(icon.data, 'base64');
    await writeFile(new URL(icon.filename, output), png);
    console.log(`${icon.filename}: ${icon.size}x${icon.size}, ${png.length} bytes, opaque white background${icon.maskable ? ', safe circle verified' : ''}`);
  }
} finally {
  await browser?.close();
  await server.close();
}
