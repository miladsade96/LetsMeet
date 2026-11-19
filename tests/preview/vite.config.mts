import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  publicDir: fileURLToPath(new URL("../../public", import.meta.url)),
  resolve: {
    alias: [
      {
        find: "next/navigation",
        replacement: fileURLToPath(new URL("./router.tsx", import.meta.url)),
      },
      {
        find: "next/link",
        replacement: fileURLToPath(new URL("./link.tsx", import.meta.url)),
      },
      {
        find: "next/image",
        replacement: fileURLToPath(new URL("./image.tsx", import.meta.url)),
      },
      {
        find: "@clerk/nextjs",
        replacement: fileURLToPath(new URL("./clerk.tsx", import.meta.url)),
      },
      {
        find: "@stream-io/video-react-sdk",
        replacement: fileURLToPath(new URL("./stream.tsx", import.meta.url)),
      },
      {
        find: "@",
        replacement: fileURLToPath(new URL("../..", import.meta.url)),
      },
    ],
  },
  server: { host: "127.0.0.1", port: 4174, strictPort: true },
  esbuild: { jsx: "automatic" },
});
