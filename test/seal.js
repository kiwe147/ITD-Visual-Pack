// Шифр комментариев мода (3.3.10.4): «ITDXE <base64url>» = соль (1 байт) + XOR текста с ключом из скрипта.
// Для тестов: openText(content, src) → открытый текст; sealText(text, src) → как пишет мод.
const keyOf = src => Buffer.from(src.match(/const OBF_KEY = new TextEncoder\(\)\.encode\('([^']+)'\)/)[1], 'utf8');
const xor = (buf, salt, key) => Buffer.from(buf.map((b, i) => b ^ key[(i + salt) % key.length] ^ ((salt * 31 + i * 7) & 255)));
function openText(content, src) {
  const t = String(content || '').trim();
  if (!t.startsWith('ITDXE ')) return t;
  const b = Buffer.from(t.slice(6).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  return xor(b.subarray(1), b[0], keyOf(src)).toString('utf8');
}
function sealText(text, src, salt = 7) {
  const body = xor(Buffer.from(text, 'utf8'), salt, keyOf(src));
  return 'ITDXE ' + Buffer.concat([Buffer.from([salt]), body]).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
module.exports = { openText, sealText };
