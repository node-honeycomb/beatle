/**
 * ### koa isGenerator logic
 *
 * > see: https://github.com/ljharb/is-generator-function/blob/master/index.js
 */
const toStr = Object.prototype.toString;
const fnToStr = Function.prototype.toString;
const isFnRegex = /^\s*(?:function)?\*/;
const hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';
const getProto = Object.getPrototypeOf;
const getGeneratorFunc = function () { // eslint-disable-line consistent-return
  if (!hasToStringTag) {
    return false;
  }
  try {
    return Function('return function*() {}')();
  } catch (e) {
    // error
  }
};
const generatorFunc = getGeneratorFunc();
const GeneratorFunction = generatorFunc ? getProto(generatorFunc) : {};

export default function isGenerator(fn) {
  if (typeof fn !== 'function') {
    return false;
  }

  if (isFnRegex.test(fnToStr.call(fn))) {
    return true;
  }
  if (!hasToStringTag) {
    var str = toStr.call(fn);
    return str === '[object GeneratorFunction]';
  }
  const _proto_ = getProto(fn);

  return _proto_ === GeneratorFunction ||
    (_proto_.displayName || _proto_.name) === 'GeneratorFunctionPrototype';
}
