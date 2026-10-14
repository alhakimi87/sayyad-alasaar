// محوّل الدانوب: يستخدم Algolia (فهرس spree_products، tenant_id = 1 للدانوب)
// يقرأ مفتاح البحث العام من صفحة البحث نفسها.
const { get } = require('./http');

let cfg = null;
async function getCfg() {
  if (cfg && Date.now() - cfg.at < 3600e3) return cfg;
  const html = await get('https://www.danube.sa/ar/search');
  const pick = re => (html.match(re) || [])[1];
  cfg = {
    appId: pick(/appId:\s*'([^']+)'/),
    key: pick(/apiKey:\s*'([^']+)'/),
    index: pick(/indexName:\s*'([^']+)'/) || 'spree_products',
    at: Date.now(),
  };
  if (!cfg.appId || !cfg.key) { cfg = null; throw new Error('لم أجد إعدادات البحث'); }
  return cfg;
}

module.exports = async function danube(store, q) {
  const c = await getCfg();
  const res = await fetch(`https://${c.appId}-dsn.algolia.net/1/indexes/${c.index}/query`, {
    method: 'POST',
    headers: { 'X-Algolia-Application-Id': c.appId, 'X-Algolia-API-Key': c.key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q, filters: 'tenant_id = 1', hitsPerPage: 20, removeWordsIfNoResults: 'allOptional' }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) { cfg = null; throw new Error(`Algolia ${res.status}`); }
  const data = await res.json();
  return (data.hits || []).map(h => ({
    title: h.full_name_ar || h.name_ar || h.full_name_en,
    price: h.price,
    oldPrice: h.on_sale && h.original_price > h.price ? h.original_price : null,
    image: h.image,
    url: 'https://www.danube.sa/ar' + (h.url_ar || ''),
    inStock: h.in_stock !== false,
  }));
};
