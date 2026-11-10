import type { NextConfig } from "next";

// Seluruh app berisi data per-user, jadi semua halaman dirender dinamis.
const nextConfig: NextConfig = {
  // Supaya bisa dibuka lewat 127.0.0.1 atau IP jaringan (mis. dari HP) saat development.
  allowedDevOrigins: ["127.0.0.1", "192.168.1.6"],
};

export default nextConfig;
