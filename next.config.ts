import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Só afeta `next dev`: deixa abrir a app no telemóvel pela rede de casa.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
