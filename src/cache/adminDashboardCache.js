const getKey = (dealershipId, year, month) =>
  `admin_dashboard:${dealershipId}:${year}-${month}`;

export const loadDashboardCache = (dealershipId, year, month) => {
  try {
    const raw = localStorage.getItem(getKey(dealershipId, year, month));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveDashboardCache = (dealershipId, year, month, payload) => {
  try {
    localStorage.setItem(
      getKey(dealershipId, year, month),
      JSON.stringify(payload)
    );
  } catch {}
};

export const clearDashboardCache = (dealershipId) => {
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith(`admin_dashboard:${dealershipId}:`)) {
      localStorage.removeItem(k);
    }
  });
};
