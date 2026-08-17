/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three"],
  async rewrites() {
    // Next ignores `app/` folders beginning with a dot, so the mobile-app
    // association files live under /well-known/ and are surfaced at the real
    // /.well-known/ paths that Android and Apple fetch.
    return [
      {
        source: "/.well-known/assetlinks.json",
        destination: "/well-known/assetlinks.json",
      },
      {
        source: "/.well-known/apple-app-site-association",
        destination: "/well-known/apple-app-site-association",
      },
    ];
  },
};

export default nextConfig;
