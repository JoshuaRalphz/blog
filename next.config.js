/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
  api: {
    externalResolver: true,
    bodyParser: false
  }
};

export default nextConfig;
