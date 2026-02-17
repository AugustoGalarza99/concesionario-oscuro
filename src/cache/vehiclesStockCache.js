const CACHE_PREFIX = "vehicles_stock";

const cacheKey = (dealershipId) =>
  `${CACHE_PREFIX}:${dealershipId}`;

export const loadVehiclesCache = (dealershipId) => {
  try {
    const raw = localStorage.getItem(cacheKey(dealershipId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveVehiclesCache = (dealershipId, payload) => {
  localStorage.setItem(
    cacheKey(dealershipId),
    JSON.stringify(payload)
  );
};

export const clearVehiclesCache = (dealershipId) => {
  localStorage.removeItem(cacheKey(dealershipId));
};
