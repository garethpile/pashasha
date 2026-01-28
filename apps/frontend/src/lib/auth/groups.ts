export const normalizeGroup = (group: string) => group.trim().toLowerCase();

export const hasGroup = (groups: string[] | undefined, ...allowed: string[]) => {
  const normalized = (groups ?? []).map(normalizeGroup);
  const allowedNormalized = allowed.map(normalizeGroup);
  return normalized.some((group) => allowedNormalized.includes(group));
};

export const isAdminGroup = (groups: string[] | undefined) =>
  hasGroup(groups, 'administrators', 'admin');

export const isCivilServantGroup = (groups: string[] | undefined) =>
  hasGroup(groups, 'civilservants', 'civilservant');

export const isCustomerGroup = (groups: string[] | undefined) =>
  hasGroup(groups, 'customers', 'customer');
