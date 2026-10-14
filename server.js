// صياد الأسعار — السيرفر
// GET /api/search?q=سيريلاك قمح   → يبحث في كل المتاجر بنفس اللحظة ويرجع النتائج مرتبة من الأرخص
// GET /api/stores                  → قائمة المتاجر
const express = require('express');
const path = require('path');
const allStores = require('./stores');
const stores = allStores.filter(s => !s.disabled);
const adapters = require('./adapters');

const app = express();
const PORT = process.env.PORT || 3000;
const STORE_TIMEOUT = 10000;           // أقصى وقت لكل متجر
const CACHE_MS = 15 * 60 * 1000;       // نحفظ نتيجة البحث 15 دقيقة
const cache = new Map();

app.use((req, res, next) => { res.set('Access-Control-Allow-Origin', '*'); next(); });
app.use(express.static(path.join(__dirname, 'public')));

// توحيد الحروف العربية للمطابقة (أ إ آ → ا، ة → ه، ى → ي)
const norm = s => String(s).toLowerCase()
  .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
  .replace(/[\u064B-\u0652]/g, '').replace(/\s+/g, ' ').trim();

// نسبة تطابق كلمات البحث مع اسم المنتج
// "هيكل" الكلمة بدون حروف المد، عشان "سيريلاك" = "سيرلاك" و"بانادول" = "بندول"
const skel = s => s.replace(/[اويء]/g, '');
function relevance(q, title) {
  const words = norm(q).split(' ').filter(w => w.length > 1);
  if (!words.length) return 1;
  const t = norm(title), ts = skel(t);
  return words.filter(w => t.includes(w) || (skel(w).length > 2 && ts.includes(skel(w)))).length / words.length;
}

function withTimeout(p, ms) {
  return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('انتهى الوقت')), ms))]);
}

async function searchStore(store, q) {
  const t0 = Date.now();
  try {
    const items = await withTimeout(adapters[store.type](store, q), STORE_TIMEOUT);
    const good = items
      .filter(i => i.price && i.title)
      .map(i => ({ ...i, score: relevance(q, i.title) }))
      .filter(i => i.score >= 0.5)
      .sort((a, b) => b.score - a.score || a.price - b.price)
      .slice(0, 5);
    return { store: store.id, ok: true, ms: Date.now() - t0, items: good };
  } catch (e) {
    return { store: store.id, ok: false, ms: Date.now() - t0, error: e.message, items: [] };
  }
}

app.get('/api/stores', (req, res) => {
  res.json(stores.map(({ id, name, group, color }) => ({ id, name, group, color })));
});

app.get('/api/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.status(400).json({ error: 'اكتب اسم المنتج' });
  const only = req.query.stores ? String(req.query.stores).split(',') : null;
  const key = norm(q) + '|' + (only || []).join(',');

  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return res.json({ ...hit.data, cached: true });

  const list = stores.filter(s => !only || only.includes(s.id));
  const results = await Promise.all(list.map(s => searchStore(s, q)));   // كل المتاجر بالتوازي

  const byId = Object.fromEntries(stores.map(s => [s.id, s]));
  const offers = results.flatMap(r => r.items.map(i => ({
    ...i, storeId: r.store, storeName: byId[r.store].name, storeColor: byId[r.store].color,
  }))).sort((a, b) => (b.inStock - a.inStock) || a.price - b.price);

  const data = {
    query: q,
    at: new Date().toISOString(),
    offers,
    status: results.map(r => ({ store: r.store, name: byId[r.store].name, ok: r.ok, count: r.items.length, ms: r.ms, error: r.error })),
  };
  cache.set(key, { at: Date.now(), data });
  res.json(data);
});

app.listen(PORT, () => console.log(`صياد الأسعار يعمل على http://localhost:${PORT}`));
