/**
 * # 替换字符串
 *
 * + Substitutes keywords in a string using an object/array.
 *  Removes undef keywords and ignores escaped keywords.
 *  > see: https://g.alicdn.com/??kissy/k/6.2.4/seed.js
 */
const EMPTY = '';

export default function substitute(str, o, delCb, delimeter) {
  if (typeof str !== 'string' || !o) {
    return str;
  }
  const arr = [];
  const newStr = str.replace(delimeter, function (match, name) {
    if (match.charAt(0) === '\\') {
      return match.slice(1);
    }
    if ((o[name] === undefined)) {
      return EMPTY;
    } else {
      arr.push(name);
      return o[name];
    }
  });
  if (delCb) {
    arr.forEach(delCb);
  }

  return newStr;
}
