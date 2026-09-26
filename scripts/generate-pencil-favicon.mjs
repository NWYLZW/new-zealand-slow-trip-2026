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
  await page.route('**/favicon-renderer', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Favicon renderer</title>' }));
  await page.goto(`${server.resolvedUrls.local[0]}favicon-renderer`);
  const icons = await page.evaluate(async () => {
    const { drawFavicon } = await import('/scripts/lib/pencil-favicon.js');
    return [16, 32, 48, 128].map(size => {
      const canvas = drawFavicon(size), data = canvas.getContext('2d').getImageData(0, 0, size, size).data;
      let ink = 0, red = 0, edge = 0;
      for (let i = 0; i < data.length; i += 4) {
        const pixel = i / 4, x = pixel % size, y = Math.floor(pixel / size);
        if (data[i + 3] > 50 && data[i + 1] < 160) ink++;
        if (data[i + 3] > 50 && data[i] > data[i + 1] * 1.2) red++;
        if ((!x || !y || x === size - 1 || y === size - 1) && data[i + 3]) edge++;
      }
      return { size, ink, red, edge, data: canvas.toDataURL().split(',')[1] };
    });
  });
  const output = new URL('../public/icons/', import.meta.url);
  await mkdir(output, { recursive: true });
  for (const icon of icons) {
    assert(icon.ink > icon.size * icon.size * .09, 'Favicon is too faint');
    assert(icon.red > 0 && icon.edge === 0, 'Missing accent or clipped silhouette');
    icon.png = Buffer.from(icon.data, 'base64');
    await writeFile(new URL(`pencil-favicon-${icon.size}.png`, output), icon.png);
    console.log(`${icon.size}px: ${icon.png.length} bytes, ${icon.ink} dark pixels, ${icon.red} accent pixels, no clipped edges`);
  }
  const small = icons.filter(icon => icon.size <= 48), header = Buffer.alloc(6 + small.length * 16);
  header.writeUInt16LE(1, 2); header.writeUInt16LE(small.length, 4);
  let offset = header.length;
  small.forEach((icon, index) => {
    const entry = 6 + index * 16;
    header[entry] = header[entry + 1] = icon.size;
    header.writeUInt16LE(1, entry + 4); header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(icon.png.length, entry + 8); header.writeUInt32LE(offset, entry + 12);
    offset += icon.png.length;
  });
  await writeFile(new URL('pencil-favicon.ico', output), Buffer.concat([header, ...small.map(icon => icon.png)]));
} finally {
  await browser?.close();
  await server.close();
}
