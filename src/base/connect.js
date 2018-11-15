import {connect} from 'react-redux';

function deepMerge(a, b, extra, obj) {
  obj = Object.assign({}, obj);
  for (let key in a) {
    if (Object(a[key]) === a[key] && Object(b[key]) === b[key]) {
      obj[key] = Object.assign({}, a[key], b[key]);
    } else if (b[key] === undefined) {
      obj[key] = a[key];
    } else {
      obj[key] = b[key];
    }
  }
  for (let key in b) {
    if (obj[key] === undefined) {
      obj[key] = b[key];
    }
  }
  for (let key in extra) {
    obj[key] = extra[key];
  }
  return obj;
}

/**
 * # 设置视图
 *
 * + bindings绑定的数据和方法，以数据模型名称在props下增加一层属性名，需要把connect的属性合并改为深度合并
 * + context主要生成的react-context
 */
export default function viewConnect(instance, dispatch, props = {}) {
  function mergeProps(stateProps, dispatchProps, parentProps) {
    let nextProps;
    if (props.getProps) {
      Object.assign(props, props.getProps(parentProps));
    }
    if (instance.flattern) {
      nextProps = Object.assign({}, props, stateProps, dispatchProps, parentProps);
    } else {
      nextProps = deepMerge(stateProps, dispatchProps, parentProps, props);
    }
    nextProps.dispatch = dispatch;
    return nextProps;
  }

  return (BaseComponent) => {
    let mergeStateToProps;
    let mergeActionToProps;
    if (typeof instance.dataBindings === 'function') {
      mergeStateToProps = instance.dataBindings;
    } else {
      mergeStateToProps = (state, ownProps) => {
        const iState = {};
        for (let key in instance.dataBindings) {
          if (typeof instance.dataBindings[key] === 'function') {
            iState[key] = instance.dataBindings[key]
              .call(instance, state, ownProps);
          } else {
            iState[key] = instance.dataBindings[key];
          }
        }
        return iState;
      };
    }

    if (typeof instance.eventBindings === 'function') {
      mergeActionToProps = instance.eventBindings;
    } else {
      mergeActionToProps = (dispatch) => {
        const iActions = {};
        for (let key in instance.eventBindings) {
          iActions[key] = (...args) => {
            const result = instance.eventBindings[key]
              .apply(instance, args);
            if (typeof result === 'function') {
              result(dispatch);
            } else {
              dispatch(result);
            }
          };
        }
        return iActions;
      };
    }

    return connect(mergeStateToProps, mergeActionToProps, mergeProps, {withRef: true})(BaseComponent);
  };
}
