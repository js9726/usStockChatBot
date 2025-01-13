import type { NextConfig } from "next";

const nextConfig = {
  output: 'export', // Enable static export
  assetPrefix: './',
  trailingSlash: true,
};
module.exports = nextConfig;
