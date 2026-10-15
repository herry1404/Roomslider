import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
let cafeSlugLock;
try {
  cafeSlugLock = JSON.parse(
    fs.readFileSync(path.resolve(rootDir, "../cafes/slugs.lock.json"), "utf8")
  );
} catch {
  cafeSlugLock = {};
}

const cafePathDenylist = [];
const addCafePath = (value) => {
  if (typeof value !== "string" || !value.trim()) return;
  const slug = value.trim().replace(/^\/+|\/+$/g, "");
  const escapedSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (escapedSlug) cafePathDenylist.push(new RegExp("^/" + escapedSlug + "(/|$)"));
};
const visitCafeLock = (value, keyHint) => {
  if (Array.isArray(value)) {
    value.forEach((entry) => visitCafeLock(entry));
    return;
  }
  if (!value || typeof value !== "object") return;
  if (typeof value.slug === "string") {
    addCafePath(value.slug);
    if (Array.isArray(value.redirects)) value.redirects.forEach(addCafePath);
  } else if (keyHint && Array.isArray(value.redirects)) {
    addCafePath(keyHint);
    value.redirects.forEach(addCafePath);
  }
  Object.entries(value).forEach(([key, entry]) => visitCafeLock(entry, key));
};
visitCafeLock(cafeSlugLock || {});
// Keep the currently served cafe menu excluded if this checkout has no slug lock.
addCafePath("htlcafe");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");
  return {
  plugins: [
    react(),
    {
      name: "roomslider-inline-api-base",
      transformIndexHtml: {
        order: "pre",
        handler(html) {
          return html.replaceAll(
            "__ROOMSLIDER_API_BASE__",
            JSON.stringify(env.VITE_API_URL || "")
          );
        },
      },
    },
    VitePWA({
      injectRegister: null,
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons.svg", "offline.html"],
      manifest: {
        name: "RoomSlider",
        short_name: "RoomSlider",
        description: "Rooms, PGs, hostels and flats in Indore",
        theme_color: "#16a34a",
        background_color: "#0B0F0E",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        importScripts: ["/push-sw.js"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [
          ...cafePathDenylist,
          /^\/c\//,
          /^\/cafe\//,
          /^\/api\//,
          /^\/api/,
          /^\/\.well-known\//,
          /^\/llms\.txt$/,
        ],
        globIgnores: ["**/*.map"],
        runtimeCaching: [
          {
              urlPattern: ({ request, url }) =>
                request.mode === "navigate" &&
                !url.pathname.startsWith("/c/") &&
                !url.pathname.startsWith("/cafe/") &&
                !/^\/htlcafe(?:\/|$)/.test(url.pathname),
            handler: "NetworkFirst",
            options: {
              cacheName: "pages-cache",
              networkTimeoutSeconds: 5,
              plugins: [
                {
                  handlerDidError: async () => {
                    return caches.match("/offline.html");
                  },
                },
              ],
            },
          },
        ],
      },
    }),
    ...(env.ANALYZE === "true"
      ? [visualizer({
          filename: "dist/bundle-stats.json",
          template: "raw-data",
          gzipSize: true,
          brotliSize: true,
          open: false,
        })]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
  },
  build: {
    target: "es2020",
    sourcemap: "hidden",
    cssCodeSplit: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "react-vendor",
              test: /node_modules\/(react|react-dom|react-router-dom|scheduler)\//,
            },
            {
              name: "leaflet",
              test: /node_modules\/(leaflet|react-leaflet|react-leaflet-cluster|leaflet\.markercluster)\//,
            },
          ],
        },
      },
    },
  },
  server: {
    host: true,
    allowedHosts: [".ngrok-free.app", ".ngrok-free.dev"],
  },
  };
});
