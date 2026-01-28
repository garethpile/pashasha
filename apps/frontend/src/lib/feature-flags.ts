export const eclipseEnabled = () => {
  const raw = process.env.NEXT_PUBLIC_ENABLE_ECLIPSE;
  if (!raw) return true;
  return raw.toLowerCase() !== 'false';
};
