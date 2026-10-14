// محوّل التميمي (منصة Zopsmart): المنتجات داخل __NEXT_DATA__
// السعر = mrp - discount
const { get, parsePrice } = require('./http');

function findProducts(o) {
  if (!o || typeof o !== 'object') return null;
  if (Array.isArray(o) && o[0] && o[0].brand !== undefined && (o[0].variants || o[0].storeSpecificData)) return o;
  for (const k in o) { const r = findProducts(o[k]); if (r) return r; }
  return null;
}

module.exports = async function tamimi(store, q) {
  const html = await get(store.searchUrl.replace('{q}', encodeURIComponent(q)));
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('لم أجد بيانات الصفحة');
  const products = findProducts(JSON.parse(m[1])) || [];
  const out = [];
  for (const p of products) {
    for (const v of (p.variants?.length ? p.variants : [p])) {
      const sd = v.storeSpecificData?.[0] || {};
      const mrp = parsePrice(sd.mrp);
      const disc = parseFloat(sd.discount) || 0;
      if (!mrp) continue;
      const price = Math.round((mrp - disc) * 100) / 100;
      out.push({
        title: [p.brand?.name, p.name, v.name && v !== p ? v.name : ''].filter(Boolean).join(' '),
        price,
        oldPrice: disc > 0 ? mrp : null,
        image: (v.images || p.images || [])[0] || null,
        url: `https://shop.tamimimarkets.com/ar/product/${p.slug}`,
        inStock: sd.unlimitedStock || sd.stock > 0,
      });
    }
  }
  return out;
};
