// محوّل مواقع Magento التي تستخدم Algolia للبحث (المتحدة وغيرها)
// يقرأ إعدادات البحث العامة (applicationId / apiKey / indexName) من الصفحة الرئيسية
// للمتجر — نفس ما يستخدمه متصفح أي زائر — ثم يسأل Algolia مباشرة.
// (تم التحقق منه على المتحدة: سيريلاك قمح وحليب 400 جم = 33.51)
const { get, parsePrice } = require('./http');

const cfgCache = {};
const CFG_TTL = 60 * 60 * 1000;

async function getConfig(store) {
  const c = cfgCache[store.id];
  if (c && Date.now() - c.at < CFG_TTL) return c;
  const html = await get(store.home);
  const pick = k => (html.match(new RegExp(`"${k}":"([^"]+)"`)) || [])[1];
  const cfg = { appId: pick('applicationId'), key: pick('apiKey'), index: pick('indexName'), at: Date.now() };
  if (!cfg.appId || !cfg.key || !cfg.index) throw new Error('لم أجد إعدادات Algolia');
  return (cfgCache[store.id] = cfg);
}

async function query(cfg, q) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`https://${cfg.appId}-dsn.algolia.net/1/indexes/${cfg.index}_products/query`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'X-Algolia-Application-Id': cfg.appId, 'X-Algolia-API-Key': cfg.key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q, hitsPerPage: 20 }),
    });
    if (!res.ok) throw new Error(`Algolia ${res.status}`);
    return res.json();
  } finally { clearTimeout(t); }
}

module.exports = async function algolia(store, q) {
  let cfg = await getConfig(store);
  let data;
  try { data = await query(cfg, q); }
  catch (e) { delete cfgCache[store.id]; cfg = await getConfig(store); data = await query(cfg, q); } // المفتاح قد يتجدد
  return (data.hits || []).map(h => {
    const p = h.price?.SAR || {};
    const old = p.bv_default_original ?? parsePrice(p.default_original_formated);
    return {
      title: h.name,
      price: parsePrice(p.default),
      oldPrice: old && old > p.default ? old : null,
      image: h.image_url || h.thumbnail_url,
      url: h.url,
      inStock: h.in_stock !== 0 && h.in_stock !== false,
    };
  });
};
