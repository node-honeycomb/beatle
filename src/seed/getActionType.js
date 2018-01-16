/**
 * # 生成actionType
 *
 * ```
 *  getActionType('user', 'getUser', 'success') => '@@user/getUser/success';
 *
 *  getActionType('user', 'getUser') => '@@user/getUser'
 * ```
 */
export default function getActionType(ns, name, status) {
  if (!status) {
    return '@@' + ns + '/' + name;
  } else {
    return '@@' + ns + '/' + name + '/' + status;
  }
}
