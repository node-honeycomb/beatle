import propTypes from 'prop-types';
import ajaxShape from '../utils/ajaxShape';

const resourceActionShape = propTypes.oneOfType([propTypes.func, propTypes.shape(ajaxShape)]);

// # Resource接口定义，并提供校验是否合法的方法
export default function checkerShapeForResource(resource, location) {
  const shapeTypes = {};
  for (let key in resource) {
    shapeTypes[key] = resourceActionShape;
  }
  return propTypes.checkPropTypes(shapeTypes, resource, location, 'Beatle');
}
