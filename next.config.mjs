/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    // This repo lives under OneDrive-synced `Documents` on Windows. OneDrive (and
    // AV) lock `.next/cache` files mid-write, so webpack's persistent filesystem
    // cache fails its atomic rename (`ENOENT: rename 2.pack.gz_ -> 2.pack.gz`),
    // corrupting the cache and orphaning route chunks (`page.js` 404 → the page
    // loads but never hydrates → nothing is clickable). Use the in-memory cache in
    // dev to sidestep the disk rename. No effect on production builds.
    if (dev) {
      config.cache = { type: 'memory' };
    }
    return config;
  },
};

export default nextConfig;
