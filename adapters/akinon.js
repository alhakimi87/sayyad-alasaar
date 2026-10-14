// محوّل مواقع منصة Akinon (وايتس)
// (تم التحقق منه: سيتافيل لوشن مرطب 473 مل = 125.93 بدل 167.90)
const { get, parsePrice, absUrl } = require('./http');
const { decodeNextF, grabJson } = require('./rsc');

module.exports = async function akinon(store, q) {
  const html = await get(store.searchUrl.replace('{q}', encodeURIComponent(q)));
  const products = grabJson(decodeNextF(html), '"products":[') || [];
  const base = new URL(store.searchUrl).origin + '/ar-sa';
  return products.map(p => {
    const price = parsePrice(p.price);
    const retail = parsePrice(p.retail_price);
    return {
      title: p.name || p.attributes?.l_name,
      price,
      oldPrice: retail && retail > price ? retail : null,
      image: p.productimage_set?.[0]?.image,
      url: absUrl(base + (p.absolute_url || ''), base),
      inStock: p.in_stock !== false,
    };
  });
};
