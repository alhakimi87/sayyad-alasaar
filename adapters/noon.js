// محوّل نون السعودية: النتائج مضمّنة في الصفحة (hits: sku, brand, name, price, sale_price, url)
// (تم التحقق منه: سيريلاك طعام للأطفال من القمح 400g = 31 بدل 35.95)
// ملاحظة: نون عنده حماية Akamai وقد يرفض بعض طلبات السيرفرات؛ وقتها يظهر ✗ ويكمل الباقي.
const { get } = require('./http');

const RE = /sku:"(\w+)",sku_config:"\w+",brand:"([^"]*)",name:"((?:[^"\\]|\\.)*)"[\s\S]{0,800}?price:([\d.]+),sale_price:([\d.]+|null)[\s\S]{0,40}?url:"([^"]+)"[\s\S]{0,300}?image_url:"([^"]+)"/g;

module.exports = async function noon(store, q) {
  const html = await get(store.searchUrl.replace('{q}', encodeURIComponent(q)));
  const out = [], seen = new Set();
  for (const m of html.matchAll(RE)) {
    const [, sku, brand, name, priceS, saleS, slug, img] = m;
    if (seen.has(sku)) continue;
    seen.add(sku);
    const price = parseFloat(priceS);
    const sale = saleS === 'null' ? null : parseFloat(saleS);
    let title; try { title = JSON.parse(`"${name}"`); } catch { title = name; }
    out.push({
      title: title.includes(brand) ? title : `${brand} ${title}`,
      price: sale && sale < price ? sale : price,
      oldPrice: sale && sale < price ? price : null,
      image: img,
      url: `https://www.noon.com/saudi-ar/${slug}/${sku}/p/`,
      inStock: true,
    });
  }
  return out;
};
