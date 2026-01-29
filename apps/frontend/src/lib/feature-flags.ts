export const eclipseEnabled = () => {
  const raw = process.env.NEXT_PUBLIC_ENABLE_ECLIPSE;
  if (!raw) return false;
  return raw.toLowerCase() === 'true';
};
