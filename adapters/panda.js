// محوّل بندة: صفحة البحث /ar/plp/<base64("s=" + كلمة البحث)>
// والمنتجات موجودة داخل بيانات Next.js (products → varieties)
// (تم التحقق منه: سيرلاك حبوب أطفال قمح 1 كجم = 66.99، نفس صورة "صياد الأسعار")
const { get, parsePrice } = require('./http');
const { decodeNextF, grabJson } = require('./rsc');

module.exports = async function panda(store, q) {
  const id = Buffer.from('s=' + encodeURIComponent(q)).toString('base64').replace(/=+$/, '');
  const pageUrl = `https://panda.sa/ar/plp/${id}`;
  const html = await get(pageUrl);
  const products = grabJson(decodeNextF(html), '"products":[') || [];
  const out = [];
  for (const p of products) {
    for (const v of p.varieties || []) {
      const price = parsePrice(v.price);
      const before = parsePrice(v.undiscounted_price);
      out.push({
        title: p.varieties.length > 1 ? `${p.name} (${v.size} ${v.unit})` : p.name,
        price,
        oldPrice: before && before > price ? before : null,
        image: v.imageURL,
        url: pageUrl,               // بندة لا تعطي رابط منتج مباشر في صفحة البحث
        inStock: v.availability === 1,
      });
    }
  }
  return out;
};
