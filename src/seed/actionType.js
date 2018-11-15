/**
 * # 生成actionType
 *
 * ```
 *  encodeActionType('user', 'getUser', 'success') => '@@user/getUser/success';
 *
 *  encodeActionType('user', 'getUser') => '@@user/getUser'
 * ```
 */
export function encodeActionType(ns, name, status) {
  if (status) {
    return '@@' + ns + '/' + name + '/' + status;
  } else {
    return '@@' + ns + '/' + name;
  }
}

export function decodeActionType(type) {
  const [modelName, actionName, status] = type.split('/');
  return [modelName.substr(2), actionName, status];
}

export function actionToType(actionName) {
  return '@@' + actionName.replace(/\./g, '/');
}

export function typeToAction(ns, name, status) {
  if (status) {
    return ns + '.' + name + '.' + status;
  } else {
    return ns + '.' + name;
  }
}
