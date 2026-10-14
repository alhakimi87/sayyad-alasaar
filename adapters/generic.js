// محوّل عام: يقرأ صفحة البحث ويحاول ثلاث طرق بالترتيب
//  1) بيانات JSON-LD (Product / ItemList) — كثير من المواقع تضعها لمحركات البحث
//  2) بيانات Next.js المضمّنة (__NEXT_DATA__) — مواقع مثل النهدي ونون
//  3) بطاقات المنتجات في HTML (اسم + سعر)
const cheerio = require('cheerio');
const { get, parsePrice, absUrl } = require('./http');

function fromProductLd(p, base) {
  const offer = Array.isArray(p.offers) ? p.offers[0] : (p.offers || {});
  const price = parsePrice(offer.price ?? offer.lowPrice);
  if (!p.name || !price) return null;
  return {
    title: String(p.name).trim(),
    price,
    image: absUrl(Array.isArray(p.image) ? p.image[0] : (p.image?.url || p.image), base),
    url: absUrl(p.url || offer.url, base),
    inStock: !/OutOfStock/i.test(offer.availability || ''),
  };
}

function jsonLd($, base) {
  const out = [];
  $('script[type="application/ld+json"]').each((_, s) => {
    let d; try { d = JSON.parse($(s).html()); } catch { return; }
    const walk = n => {
      if (!n || typeof n !== 'object') return;
      if (Array.isArray(n)) return n.forEach(walk);
      if (n['@type'] === 'Product') { const r = fromProductLd(n, base); if (r) out.push(r); }
      if (n.item) walk(n.item);
      if (n.itemListElement) walk(n.itemListElement);
      if (n['@graph']) walk(n['@graph']);
    };
    walk(d);
  });
  return out;
}

// يبحث داخل أي JSON كبير عن كائنات فيها اسم + سعر
function deepProducts(obj, base, out = [], depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 14 || out.length > 40) return out;
  if (Array.isArray(obj)) { obj.forEach(o => deepProducts(o, base, out, depth + 1)); return out; }
  const name = obj.name || obj.title || obj.product_name || obj.productName;
  const priceRaw = obj.sale_price ?? obj.salePrice ?? obj.final_price ?? obj.finalPrice
                ?? obj.price?.value ?? obj.price?.amount ?? obj.price;
  const price = typeof priceRaw === 'object' ? null : parsePrice(priceRaw);
  if (typeof name === 'string' && name.length > 3 && price) {
    out.push({
      title: name.trim(), price,
      image: absUrl(obj.image_url || obj.imageUrl || obj.image_key || obj.thumbnail || obj.image?.url || (typeof obj.image === 'string' ? obj.image : null), base),
      url: absUrl(obj.url || obj.url_key || obj.urlKey || obj.slug, base),
      inStock: obj.in_stock !== false && obj.is_in_stock !== false && obj.stock_status !== 'OUT_OF_STOCK',
    });
    return out;
  }
  for (const k in obj) deepProducts(obj[k], base, out, depth + 1);
  return out;
}

function nextData($, base) {
  const raw = $('#__NEXT_DATA__').html();
  if (!raw) return [];
  try { return deepProducts(JSON.parse(raw), base); } catch { return []; }
}

function htmlCards($, base) {
  const out = [];
  $('[class*="product-item"], [class*="product-card"], [class*="productCard"], [data-qa*="product"], li.product, div.product').each((_, el) => {
    const c = $(el);
    const title = c.find('[class*="name"], [class*="title"], h2, h3').first().text().trim();
    const price = parsePrice(c.find('[class*="special-price"], [class*="final"], [class*="price"]').first().text());
    const a = c.find('a[href]').first();
    if (title && price && title.length > 3) out.push({
      title, price,
      image: absUrl(c.find('img').attr('data-src') || c.find('img').attr('src'), base),
      url: absUrl(a.attr('href'), base),
      inStock: !/نفذ|غير متوفر|out of stock/i.test(c.text()),
    });
  });
  return out;
}

module.exports = async function generic(store, q) {
  const url = store.searchUrl.replace('{q}', encodeURIComponent(q));
  const $ = cheerio.load(await get(url));
  for (const fn of [jsonLd, nextData, htmlCards]) {
    const r = fn($, url);
    if (r.length) return r;
  }
  return [];
};
