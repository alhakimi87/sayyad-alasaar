// أدوات لقراءة بيانات مواقع Next.js الحديثة (App Router)
// البيانات تكون مقسّمة داخل self.__next_f.push([1,"..."])
function decodeNextF(html) {
  let s = '';
  for (const m of html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)) {
    try { s += JSON.parse(m[1]); } catch { /* قطعة غير نصية */ }
  }
  return s;
}

// يستخرج أول مصفوفة/كائن JSON بعد مفتاح معيّن، مثل '"products":['
function grabJson(str, key, from = 0) {
  const k = str.indexOf(key, from);
  if (k < 0) return null;
  const st = k + key.length - 1;
  let d = 0, inS = false, j = st;
  for (; j < str.length; j++) {
    const c = str[j];
    if (inS) { if (c === '\\') { j++; continue; } if (c === '"') inS = false; continue; }
    if (c === '"') inS = true;
    else if (c === '[' || c === '{') d++;
    else if (c === ']' || c === '}') { d--; if (!d) break; }
  }
  try { return JSON.parse(str.slice(st, j + 1)); } catch { return null; }
}

module.exports = { decodeNextF, grabJson };
