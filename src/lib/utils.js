// src/lib/utils.js

export const storage = {
  getArray: (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('localStorage write failed:', e);
    }
  },
};

export const fmt = {
  usd: (n, decimals = 2) =>
    typeof n === 'number' && !isNaN(n)
      ? n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
      : '0.00',
  pct: (n) => (typeof n === 'number' && !isNaN(n) ? Math.abs(n).toFixed(2) : '0.00'),
  sign: (n) => (n >= 0 ? '+' : ''),
  arrow: (n) => (n >= 0 ? '▲' : '▼'),
};