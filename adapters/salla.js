// محوّل متاجر سلة (وافي ترند، آي براند، وأي متجر سلة تضيفه)
// الطريقة 1: واجهة سلة العامة للمتجر (JSON) — الأسرع والأدق
// الطريقة 2 (احتياطية): قراءة صفحة البحث HTML
const cheerio = require('cheerio');
const { get, parsePrice, absUrl } = require('./http');

const idCache = {};

async function getStoreId(store) {
  if (store.storeId) return store.storeId;
  if (idCache[store.id]) return idCache[store.id];
  const html = await get(store.base);
  const m = html.match(/["']?store[_-]?id["']?\s*[:=]\s*["']?(\d{6,})/i)
         || html.match(/files\.salla\.network\/homepage\/(\d{6,})/)
         || html.match(/"store":\s*\{\s*"id"\s*:\s*(\d{6,})/);
  if (!m) throw new Error('لم أجد رقم متجر سلة');
  return (idCache[store.id] = m[1]);
}

async function viaApi(store, q) {
  const id = await getStoreId(store);
  const url = `https://api.salla.dev/store/v1/products?source=search&source_value=${encodeURIComponent(q)}&per_page=20`;
  const data = await get(url, { json: true, headers: { 'Store-Identifier': id, 'Accept-Language': 'ar' } });
  // سلة: price = السعر الأصلي، sale_price = سعر التخفيض (إذا is_on_sale)
  const num = v => parsePrice(typeof v === 'object' && v ? v.amount : v);
  return (data.data || []).map(p => {
    const regular = num(p.regular_price) ?? num(p.price);
    const sale = p.is_on_sale ? num(p.sale_price) : null;
    const price = sale && sale < regular ? sale : num(p.price);
    return {
      title: p.name,
      price,
      oldPrice: sale && sale < regular ? regular : null,
      image: p.image?.url || p.thumbnail || null,
      url: p.url,
      inStock: p.is_available !== false && !p.is_out_of_stock,
    };
  });
}

async function viaHtml(store, q) {
  const url = `${store.base}/ar/search?q=${encodeURIComponent(q)}`;
  const $ = cheerio.load(await get(url));
  const out = [];
  $('salla-product-card, .product-entry, .s-product-card-entry').each((_, el) => {
    const c = $(el);
    const a = c.find('a[href*="/p"]').first();
    const title = c.find('.s-product-card-content-title, .product-entry__title, h3').first().text().trim() || a.attr('title');
    const price = parsePrice(c.find('.s-product-card-sale-price, .s-product-card-price, .price, [class*="price"]').first().text());
    if (title && price) out.push({
      title, price,
      image: absUrl(c.find('img').attr('data-src') || c.find('img').attr('src'), store.base),
      url: absUrl(a.attr('href'), store.base),
      inStock: !/نفذ|غير متوفر/.test(c.text()),
    });
  });
  return out;
}

module.exports = async function salla(store, q) {
  try {
    const r = await viaApi(store, q);
    if (r.length) return r;
  } catch (e) { /* نجرب الطريقة الثانية */ }
  return viaHtml(store, q);
};
