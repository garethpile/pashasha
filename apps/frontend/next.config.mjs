/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Disable Next.js image optimization because we are statically exporting
    // and fetching dynamic images (QR codes) from the API.
    unoptimized: true,
  },
};

export default nextConfig;
