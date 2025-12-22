// Prefer explicit env (NEXT_PUBLIC_API_BASE_URL), fall back to the legacy
// NEXT_PUBLIC_BACKEND_API_ROOT, otherwise default to the CloudFront API path.
const ENV_API_ROOT =
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_API_ROOT;
// Backend API is fronted by CloudFront and exposes the base /api path.
const PROD_API_ROOT = ENV_API_ROOT || 'https://d219w61biha52r.cloudfront.net/api';
const LOCAL_API_ROOT = 'http://localhost:4000/api';

export const resolveApiRoot = () => {
  // For production/static export builds we always point to the API CloudFront.
  if (process.env.NODE_ENV === 'development') {
    return LOCAL_API_ROOT;
  }
  return PROD_API_ROOT;
};
