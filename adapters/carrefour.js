// محوّل كارفور السعودية: بيانات المنتجات داخل Next.js (productId / productName / sellingPrice)
// (تم التحقق منه: سيريلاك بالقمح والحليب 400 جرام = 40.95)
const { get } = require('./http');
const { decodeNextF } = require('./rsc');

module.exports = async function carrefour(store, q) {
  const html = await get(store.searchUrl.replace('{q}', encodeURIComponent(q)));
  const s = decodeNextF(html);
  const out = [], seen = new Set();
  for (const m of s.matchAll(/"productId":"(\d+)","productName":"((?:[^"\\]|\\.)*)"/g)) {
    if (seen.has(m[1])) continue;
    const after = s.slice(m.index, m.index + 1500);
    const before = s.slice(Math.max(0, m.index - 700), m.index);
    const selling = parseFloat((after.match(/"sellingPrice":([\d.]+)/) || [])[1]);
    if (!selling) continue;
    seen.add(m[1]);
    const marked = parseFloat((after.match(/"markedPrice":([\d.]+)/) || [])[1]);
    const path = (after.match(/"productUrl":"([^"]+)"/) || [])[1];
    let title; try { title = JSON.parse(`"${m[2]}"`).trim(); } catch { title = m[2]; }
    out.push({
      title,
      price: selling,
      oldPrice: marked > selling ? marked : null,
      image: (before.match(/"imageUrl":"([^"]+)"[^{}]*$/) || [])[1] || null,
      url: path ? 'https://www.carrefourksa.com' + path : null,
      inStock: !/"isOutOfStock":true/.test(after.slice(0, 800)),
    });
  }
  return out;
};
