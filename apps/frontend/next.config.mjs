import { withAmplifyHosting } from '@aws-amplify/adapter-nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
};

export default withAmplifyHosting(nextConfig);
