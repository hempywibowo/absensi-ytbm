import { fileURLToPath } from "url";
import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Folder ini berada di dalam repo absensi-ytbm; pastikan Next.js memakai folder ini sebagai root,
  // bukan root repo induk.
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url)),
  },
};

export default nextConfig;
