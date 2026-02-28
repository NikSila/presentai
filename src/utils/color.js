export function luminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = (x) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function textColorOn(hex) {
  return luminance(hex) < 0.45 ? '#FFFFFF' : '#1A1A2E';
}

export function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

export function isValidHex(hex) {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

export function ensureHex(val, fallback) {
  return isValidHex(val) ? val : fallback;
}
