// محوّل النهدي: صفحة البحث تحتوي نتائج Algolia جاهزة داخل
// window[Symbol.for("InstantSearchInitialResults")] = {...}
// (تم التحقق منه على الموقع الحقيقي: سيريلاك قمح 1 كجم = 85.74)
const { get, parsePrice } = require('./http');

const MARK = 'window[Symbol.for("InstantSearchInitialResults")] = ';

module.exports = async function nahdi(store, q) {
  const html = await get(store.searchUrl.replace('{q}', encodeURIComponent(q)));
  const a = html.indexOf(MARK);
  if (a < 0) throw new Error('لم أجد نتائج البحث في الصفحة');
  const start = a + MARK.length;
  const json = html.slice(start, html.indexOf('</script>', start)).trim().replace(/;\s*$/, '');
  const data = JSON.parse(json);
  const idx = Object.values(data)[0];
  const hits = idx?.results?.[0]?.hits || [];
  return hits.map(h => {
    const p = h.price?.SAR || {};
    const slug = String(h.url || '').split('/').pop();
    const old = parsePrice(p.default_original_formated);
    return {
      title: h.name,
      price: parsePrice(p.default),
      oldPrice: old && old > p.default ? old : null,
      image: h.image_url,
      url: slug ? `https://www.nahdionline.com/ar-sa/${slug}/pdp/${h.sku}` : null,
      inStock: true,
    };
  });
};
