import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.56.1", "*.local"],
  serverExternalPackages: ["pdfkit"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  poweredByHeader: false,
};

export default nextConfig;
