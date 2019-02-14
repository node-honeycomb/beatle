import React from 'react';
import PropTypes from 'prop-types';
import {from} from 'rxjs/observable/from';
import {map} from 'rxjs/operators';
import isPlainObject from '../core/isPlainObject';

function mergeToRender(ob) {
  Object.assign(ob, {
    render(callback) {
      ob = ob.pipe(map(callback));
      return (<AsyncComponent observable={ob} />);
    }
  });
  const lift = ob.lift;
  ob.lift = function (operator) {
    const newOb = lift.call(this, operator);
    mergeToRender(newOb);
    return newOb;
  };
  return ob;
}

export default class AsyncComponent extends React.PureComponent {
  static propTypes = {
    observable: PropTypes.object.isRequired
  }
  // #! 把数据转成observable
  static observable = function (ob) {
    if (Object(ob) !== ob || isPlainObject(ob)) {
      return mergeToRender(from(Promise.resolve(ob)));
    } else {
      return mergeToRender(from(ob));
    }
  }

  state = {
    children: null
  }

  componentDidMount() {
    this.mounted = true;
    this._subscription = this.props.observable.subscribe(children => {
      if (this.mounted) {
        this.setState({children: children});
      }
    });
  }

  componentWillUnmount() {
    this.mounted = false;
    this
      ._subscription
      .unsubscribe();
  }

  render() {
    return this.state.children;
  }
}
