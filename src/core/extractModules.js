import path from 'path';
/**
 * # 提取模块
 *
 * + modules可以有3中形态：数组、map 和 context
 *  * 数组 和 context 时实例名优先为displayName
 *  * map时实例名为key
 */
export default function extractModules(modules, getName) {
  // #! 提取模块名称，组装成Json
  getName = getName || function (module, key) {
    if (module.displayName) {
      return module.displayName;
    } else if (key) {
      module.displayName = path.basename(key, path.extname(key));
      return module.displayName;
    }
  };

  let modulesMap = {};
  let name;
  // #! 数据形式，转成Map
  if (Array.isArray(modules)) {
    modules.forEach((Module) => {
      name = getName(Module) || Module.name;
      modulesMap[name] = Module;
    });
    // #! 如果是require.context返回的对象，则获取到所有的Module
  } else if (typeof modules.keys === 'function') {
    const context = modules;
    context
      .keys()
      .forEach((key) => {
        const Module = context(key);
        if (Module) {
          name = getName(Module, key);
          modulesMap[name] = Module;
        }
      });
  } else {
    // #! 否则就是Map
    let Module;
    for (let name in modules) {
      if (modules[name].default) {
        Module = modules[name].default;
      } else {
        Module = modules[name];
      }
      modulesMap[getName(Module, name)] = Module;
    }
  }

  return modulesMap;
}
