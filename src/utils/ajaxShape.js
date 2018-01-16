import propTypes from 'prop-types';

/**
 * # 接口请求参数校验
 *
 * ```
 *  Ajax.request({
 *    url,
 *    method
 *    dataType,
 *    params,
 *    headers,
 *    callback
 *  })
 * ```
 */
export default {
  url: propTypes.string.isRequired,
  method: propTypes.string,
  dataType: propTypes.string,
  params: propTypes.object,
  data: propTypes.object,
  headers: propTypes.object,
  callback: propTypes.func
};
