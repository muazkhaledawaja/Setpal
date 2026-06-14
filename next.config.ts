import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.100.4"],
  async redirects() {
    return [
      {
        source: "/landing",
        destination: "/landing/",
        permanent: false,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
