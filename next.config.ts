import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "am-a.akamaihd.net",
        pathname: "/image/**",
      },
      {
        protocol: "https",
        hostname: "static.lolesports.com",
        pathname: "/players/**",
      },
      {
        protocol: "https",
        hostname: "api.qrserver.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
