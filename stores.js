// قائمة المتاجر. لإضافة متجر: أضف سطر هنا.
// كل متجر تم فحصه على موقعه الحقيقي بتاريخ 2026-10-14.
// type = اسم المحوّل في مجلد adapters
// disabled: true = موقوف مؤقتاً (السبب مكتوب في note)

module.exports = [
  // ── صيدليات ──
  { id: 'nahdi',     name: 'النهدي',     group: 'صيدليات', type: 'nahdi',   color: '#e30613',
    searchUrl: 'https://www.nahdionline.com/ar-sa/search?query={q}' },
  { id: 'united',    name: 'المتحدة',    group: 'صيدليات', type: 'algolia', color: '#f2b705',
    home: 'https://unitedpharmacy.sa/ar/' },
  { id: 'whites',    name: 'وايتس',      group: 'صيدليات', type: 'akinon',  color: '#6b4fbb',
    searchUrl: 'https://www.whites.sa/ar-sa/list/?search_text={q}' },
  { id: 'wafitrend', name: 'وافي ترند',  group: 'صيدليات', type: 'salla',   color: '#d4508a',
    base: 'https://wafitrend.com', storeId: '617249524' },
  { id: 'ibrand',    name: 'آي براند',   group: 'صيدليات', type: 'salla',   color: '#e873a8',
    base: 'https://ibrand.com.sa', storeId: '1972477543' },
  { id: 'dawaa',     name: 'الدواء',     group: 'صيدليات', type: 'generic', color: '#00a19a',
    searchUrl: 'https://www.al-dawaa.com/ar/catalogsearch/result/?q={q}',
    disabled: true, note: 'الموقع عليه حماية Cloudflare تمنع القراءة الآلية' },

  // ── عناية ──
  { id: 'enaya',     name: 'مخازن العناية', group: 'عناية', type: 'generic', color: '#0a7cc1',
    searchUrl: '', disabled: true, note: 'ما لقيت لهم متجر إلكتروني — أرسل الرابط إذا عندك' },

  // ── سوبرماركت ──
  { id: 'panda',     name: 'بندة',       group: 'سوبرماركت', type: 'panda',     color: '#2e9e3f' },
  { id: 'danube',    name: 'الدانوب',    group: 'سوبرماركت', type: 'danube',    color: '#c8102e' },
  { id: 'carrefour', name: 'كارفور',     group: 'سوبرماركت', type: 'carrefour', color: '#1e4fa1',
    searchUrl: 'https://www.carrefourksa.com/mafsau/ar/search?keyword={q}' },
  { id: 'lulu',      name: 'لولو',       group: 'سوبرماركت', type: 'akinon',    color: '#d71920',
    searchUrl: 'https://gcc.luluhypermarket.com/ar-sa/list/?search_text={q}',
    disabled: true, note: 'يرفض طلبات السيرفرات السحابية (403)، المحوّل جاهز لو تغيّر' },
  { id: 'tamimi',    name: 'التميمي',    group: 'سوبرماركت', type: 'tamimi',    color: '#7a1f2b',
    searchUrl: 'https://shop.tamimimarkets.com/ar/search?query={q}' },

  // ── أونلاين ──
  { id: 'amazon',    name: 'أمازون',     group: 'أونلاين', type: 'amazon', color: '#ff9900',
    searchUrl: 'https://www.amazon.sa/s?k={q}&language=ar_AE' },
  { id: 'noon',      name: 'نون',        group: 'أونلاين', type: 'noon',   color: '#e6c300',
    searchUrl: 'https://www.noon.com/saudi-ar/search/?q={q}',
    disabled: true, note: 'يرفض طلبات السيرفرات السحابية (403)، المحوّل جاهز لو تغيّر' },
];
