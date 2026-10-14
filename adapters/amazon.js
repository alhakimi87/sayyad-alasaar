// محوّل أمازون السعودية (تم التحقق من شكل الصفحة: 59 نتيجة لكلمة سيريلاك)
// ملاحظة: أمازون أحياناً يطلب تحقق (كابتشا) من السيرفرات؛ في هذي الحالة يظهر ✗ ويكمل الباقي عادي.
const cheerio = require('cheerio');
const { get, parsePrice } = require('./http');

module.exports = async function amazon(store, q) {
  const url = store.searchUrl.replace('{q}', encodeURIComponent(q));
  const html = await get(url);
  if (/captcha|validateCaptcha/i.test(html) && !/s-search-result/.test(html)) throw new Error('أمازون طلب تحقق');
  const $ = cheerio.load(html);
  const out = [];
  $('[data-component-type="s-search-result"]').each((_, el) => {
    const c = $(el);
    const asin = c.attr('data-asin');
    const title = c.find('h2').text().trim();
    const price = parsePrice(c.find('.a-price:not(.a-text-price) .a-offscreen').first().text());
    const old = parsePrice(c.find('.a-price.a-text-price .a-offscreen').first().text());
    if (title && price) out.push({
      title, price,
      oldPrice: old && old > price ? old : null,
      image: c.find('img.s-image').attr('src'),
      url: asin ? `https://www.amazon.sa/dp/${asin}` : null,
      inStock: true,
    });
  });
  return out;
};
