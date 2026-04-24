import type { NextConfig } from "next";

const nextConfig: any = {
  serverExternalPackages: [
    "temml",
    "saxon-js",
    "adm-zip",
    "@xmldom/xmldom",
  ],
  transpilePackages: [],
  allowedDevOrigins: ["192.168.50.1", "192.168.120.123"],
};

export default nextConfig;
