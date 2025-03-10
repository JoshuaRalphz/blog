/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  output: 'export',
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
  api: {
    externalResolver: true,
    bodyParser: false
  }
};

export default nextConfig;
