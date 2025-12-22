/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Use static export so Amplify Hosting can serve the generated HTML bundle.
   * This writes the build output to apps/frontend/out.
   */
  output: 'export',
  images: {
    // Disable Next.js image optimization because we are statically exporting
    // and fetching dynamic images (QR codes) from the API.
    unoptimized: true,
  },
};

export default nextConfig;
