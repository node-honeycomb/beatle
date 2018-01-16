import propTypes from 'prop-types';

/**
 * # poller配置类型
 *
 * ```
 *  new Poller({
 *    delay: 500,
 *    smart: false,
 *    action: () => {
 *      return Beatle.Ajax.get('...');
 *    },
 *    catchError: (err) => {
 *    }
 *  })
 * ```
 */
export default {
  delay: propTypes.number,
  smart: propTypes.bool,
  action: propTypes.func.isRequired,
  catchError: propTypes.func
};
