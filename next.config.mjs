/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // Cuma dipakai buat testing lewat tunnel (cloudflared/ngrok) pas development — aman,
  // gak kepakai sama sekali di production build.
  allowedDevOrigins: ["*.trycloudflare.com", "average-merge-circle-dangerous.trycloudflare.com"],
};

export default nextConfig;
