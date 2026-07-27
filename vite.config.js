import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
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
  plugins: [react(), hotelSelectionPersistence()],
});
