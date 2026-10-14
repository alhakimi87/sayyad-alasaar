// أدوات مشتركة لكل المحوّلات
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';

async function get(url, { headers = {}, timeout = 9000, json = false } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': UA,
        'Accept': json ? 'application/json' : 'text/html,application/xhtml+xml,*/*',
        'Accept-Language': 'ar-SA,ar;q=0.9,en;q=0.8',
        ...headers,
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return json ? res.json() : res.text();
  } finally {
    clearTimeout(t);
  }
}

// يحوّل "٧٦٫٩٨ ر.س" أو "SAR 1,234.50" إلى رقم
function parsePrice(v) {
  if (v == null) return null;
  if (typeof v === 'number') return v > 0 ? v : null;
  let s = String(v)
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/٫/g, '.').replace(/٬/g, ',');
  const m = s.match(/\d[\d,]*(?:\.\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0].replace(/,/g, ''));
  return n > 0 ? n : null;
}

function absUrl(href, base) {
  if (!href) return null;
  try { return new URL(href, base).href; } catch { return null; }
}

module.exports = { get, parsePrice, absUrl };
