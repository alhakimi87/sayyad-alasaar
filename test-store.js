// تجربة متجر واحد أو كل المتاجر من الطرفية:
//   node test-store.js ibrand "سيريلاك"
//   node test-store.js all "بانادول"
const stores = require('./stores').filter(s => !s.disabled);
const adapters = require('./adapters');

const [, , id = 'all', q = 'سيريلاك'] = process.argv;
const list = id === 'all' ? stores : stores.filter(s => s.id === id);

(async () => {
  for (const s of list) {
    const t0 = Date.now();
    try {
      const r = await adapters[s.type](s, q);
      console.log(`\n✅ ${s.name} (${Date.now() - t0}ms) — ${r.length} نتيجة`);
      r.slice(0, 3).forEach(i => console.log(`   ${i.price} ر.س  |  ${i.title.slice(0, 60)}`));
    } catch (e) {
      console.log(`\n❌ ${s.name} — ${e.message}`);
    }
  }
})();
