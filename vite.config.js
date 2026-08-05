import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const hotelSelectionsPath = fileURLToPath(new URL("./src/data/hotel-selections.json", import.meta.url));

function hotelSelectionPersistence() {
  return {
    name: "hotel-selection-persistence",
    configureServer(server) {
      server.middlewares.use("/api/hotel-selection", (request, response, next) => {
        if (request.method !== "POST") {
          next();
          return;
        }

        let body = "";
        request.on("data", (chunk) => { body += chunk; });
        request.on("end", async () => {
          try {
            const selection = JSON.parse(body);
            const regions = selection?.regions;
            if (!regions || Object.values(regions).some((region) => !region?.hotelId || !region?.hotelName || !Array.isArray(region?.stayDates))) {
              throw new Error("Invalid hotel selection");
            }
            await writeFile(hotelSelectionsPath, `${JSON.stringify(selection, null, 2)}\n`, "utf8");
            response.statusCode = 204;
            response.end();
          } catch (error) {
            response.statusCode = 400;
            response.setHeader("Content-Type", "application/json");
            response.end(JSON.stringify({ error: error.message }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  base: "/new-zealand-slow-trip-2026/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        id: "/new-zealand-slow-trip-2026/",
        name: "2026 新西兰松弛旅行",
        short_name: "新西兰行程",
        description: "2026 年新西兰双人旅行的行程、住宿、交通与活动执行站点。",
        lang: "zh-CN",
        start_url: "./#overview",
        scope: "./",
        display: "standalone",
        background_color: "#f4f7f3",
        theme_color: "#123f36",
        orientation: "any",
        categories: ["travel", "navigation", "lifestyle"],
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        shortcuts: [
          {
            name: "行程总览",
            short_name: "行程",
            description: "打开地图和完整日历",
            url: "./#overview",
            icons: [{ src: "icons/icon-192.png", sizes: "192x192", type: "image/png" }],
          },
          {
            name: "酒店预订",
            short_name: "酒店",
            description: "打开已确认住宿与酒店详情",
            url: "./#booking",
            icons: [{ src: "icons/icon-192.png", sizes: "192x192", type: "image/png" }],
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api\//],
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff,woff2}"],
        globIgnores: ["images/**/*", "icons/**/*"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/[^/]+\/new-zealand-slow-trip-2026\/images\/.*\.(?:png|jpe?g|webp|avif)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "nz-trip-images-v1",
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 120, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/(?:[abc]\.)?tile\.openstreetmap\.org\//i,
            handler: "CacheFirst",
            options: {
              cacheName: "nz-trip-map-tiles-v1",
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 160, maxAgeSeconds: 14 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
    hotelSelectionPersistence(),
  ],
});
