import {Provider} from 'react-redux';
import PropTypes from 'prop-types';

export default function getProvider(injector, globalInjector) {
  class IProvider extends Provider {
    constructor(props, context) {
      super(props, context);

      this._childContext =  {
        store: props.store
      };
      this._unlisten = injector._services.app._setting.history.listen((location) => {
        this._childContext.location = location;
      });
    }

    componentWillUnmount() {
      this._unlisten && this._unlisten();
    }

    getChildContext() {
      for (let key in injector._services) {
        this._childContext[key] = injector._services[key];
      }
      for (let key in globalInjector._services) {
        if (this._childContext[key] === undefined) {
          this._childContext[key] = globalInjector._services[key];
        }
      }

      return this._childContext;
    }
  }

  IProvider.childContextTypes = Provider.childContextTypes;
  IProvider.childContextTypes.location = PropTypes.object;
  for (let key in injector._services) {
    IProvider.childContextTypes[key] = PropTypes.object;
  }
  for (let key in globalInjector._services) {
    if (IProvider.childContextTypes[key] === undefined) {
      IProvider.childContextTypes[key] = PropTypes.object;
    }
  }

  return IProvider;
}
