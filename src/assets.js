const baseUrl = import.meta.env?.BASE_URL ?? "/new-zealand-slow-trip-2026/";

export const assetPath = (path) => baseUrl + path.replace(/^\//, "");
