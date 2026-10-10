import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "node:url";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

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
        navigateFallbackDenylist: [/^\/api/, /^\/\.well-known\//, /^\/llms\.txt$/],
        globIgnores: ["**/*.map"],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
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
