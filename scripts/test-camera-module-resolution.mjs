import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import react from "@vitejs/plugin-react";

const root = fileURLToPath(new URL("../", import.meta.url));
const camera = fileURLToPath(new URL("../src/adventure/AdventureCamera.jsx", import.meta.url));
const settings = fileURLToPath(new URL("../src/adventure/AdventureCameraSettings.jsx", import.meta.url));
const component = fileURLToPath(new URL("../src/adventure/CameraLevel.jsx", import.meta.url));
const helper = fileURLToPath(new URL("../src/adventure/cameraLevel.js", import.meta.url));
const checked = new Set();

try {
  await build({
    root,
    configFile: false,
    logLevel: "warn",
    plugins: [
      {
        name: "check-camera-level-imports",
        enforce: "pre",
        async resolveId(source, importer) {
          const expected = [camera, settings].includes(importer) && source.startsWith("./CameraLevel")
            ? { specifier: "./CameraLevel.jsx", target: component }
            : importer === component && source.startsWith("./cameraLevel")
              ? { specifier: "./cameraLevel.js", target: helper } : null;
          if (!expected) return null;
          // Explicit extensions also protect case-sensitive CI from a macOS-only regression.
          assert.equal(source, expected.specifier);
          const resolved = await this.resolve(source, importer, { skipSelf: true });
          assert.equal(resolved?.id, expected.target);
          checked.add(expected.target);
          return resolved;
        },
      },
      react(),
    ],
    build: {
      write: false,
      emptyOutDir: false,
      minify: false,
      reportCompressedSize: false,
      rollupOptions: {
        input: { camera, settings },
        external: /^(react|react-dom)(\/|$)/,
        output: { format: "es" },
      },
    },
  });
  assert.deepEqual(checked, new Set([component, helper]));
  console.log("Camera/settings Vite module linking and explicit level imports: passed (in-memory only)");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
