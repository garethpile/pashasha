const ENV_API_ROOT =
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_API_ROOT;
const PROD_API_ROOT = ENV_API_ROOT || 'https://e59bfkkr5g.execute-api.af-south-1.amazonaws.com';
const LOCAL_API_ROOT = 'http://localhost:4000';
const ENV_VOUCHER_API_ROOT = process.env.NEXT_PUBLIC_VOUCHER_API_BASE_URL;
const PROD_VOUCHER_API_ROOT =
  ENV_VOUCHER_API_ROOT || 'https://129mgsjpi6.execute-api.af-south-1.amazonaws.com';
const LOCAL_VOUCHER_API_ROOT = 'http://localhost:4100';

export const resolveApiRoot = () => {
  if (process.env.NODE_ENV === 'development') {
    return LOCAL_API_ROOT;
  }
  return PROD_API_ROOT;
};

export const resolveVoucherApiRoot = () => {
  if (process.env.NODE_ENV === 'development') {
    return LOCAL_VOUCHER_API_ROOT;
  }
  return PROD_VOUCHER_API_ROOT;
};

export const resolveCoreApiRoot = resolveApiRoot;
export const resolveAppApiRoot = resolveCoreApiRoot;
