/* İsimlere Türkçe ek: ek('Ati','de') → "Ati'de", ek('Can','in') → "Can'ın", ek('Ati','i') → "Ati'yi", ek('Can','e') → "Can'a" */
function ek(name, type) {
  const n = String(name || ''), low = n.toLocaleLowerCase('tr');
  const vowels = 'aeıioöuü', m = [...low].reverse().find(c => vowels.includes(c)) || 'e';
  const last = [...low].pop() || 'e', endsV = vowels.includes(last);
  const back = 'aıou'.includes(m);
  const I4 = { a: 'ı', ı: 'ı', o: 'u', u: 'u', e: 'i', i: 'i', ö: 'ü', ü: 'ü' }[m];
  const A2 = back ? 'a' : 'e';
  let s;
  if (type === 'de') s = ('fstkçşhp'.includes(last) ? 't' : 'd') + A2;
  else if (type === 'in') s = endsV ? 'n' + I4 + 'n' : I4 + 'n';
  else if (type === 'i') s = (endsV ? 'y' : '') + I4;
  else if (type === 'e') s = (endsV ? 'y' : '') + A2;
  else return n;
  return n + "'" + s;
}
if (typeof module !== 'undefined') module.exports = ek;
