import PropTypes from 'prop-types';
import {Provider} from 'react-redux';

export default function getProvider(injector, globalInjector) {
  class IProvider extends Provider {
    static childContextTypes = {};
    constructor(props, context) {
      super(props, context);

      this._services = {};
      for (let key in injector._services) {
        this._services[key] = injector._services[key];
        IProvider.childContextTypes[key] = PropTypes.object;
      }
      for (let key in globalInjector._services) {
        if (this._childContext[key] === undefined) {
          this._services[key] = globalInjector._services[key];
          IProvider.childContextTypes[key] = PropTypes.object;
        }
      }
    }

    getChildContext() {
      return this._services;
    }
  }

  return IProvider;
}
