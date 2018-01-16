import propTypes from 'prop-types';

const modelShape = {
  displayName: propTypes.string,
  store: propTypes.object.isRequired,
  actions: propTypes.object,
  subscriptions: propTypes.object
};

// # Model接口定义，并提供校验是否合法的方法
export default function checkerShapeForModel(model, location) {
  return propTypes.checkPropTypes(modelShape, model, location, 'Beatle');
}
