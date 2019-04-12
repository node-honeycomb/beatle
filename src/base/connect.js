import {connect} from 'react-redux';
import hoistStatics from 'hoist-non-react-statics';

function deepMerge(obj, a, b, extra) {
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
export default function viewConnect(instance, dispatch, props = {}, getProps) {
  function mergeProps(stateProps, dispatchProps, parentProps) {
    let nextProps;
    if (instance.flattern) {
      nextProps = Object.assign({}, props, stateProps, dispatchProps, parentProps);
    } else {
      nextProps = deepMerge(props, stateProps, dispatchProps, parentProps);
    }
    if (getProps) {
      Object.assign(nextProps, getProps(nextProps));
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

    const Connect = connect(mergeStateToProps, mergeActionToProps, mergeProps)(BaseComponent);
    Connect.contextTypes = BaseComponent.contextTypes;
    return hoistStatics(Connect, BaseComponent);
  };
}
