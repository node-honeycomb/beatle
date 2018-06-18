import {Provider} from 'react-redux';
import PropTypes from 'prop-types';

export default function getProvider(injector, globalInjector) {
  class IProvider extends Provider {
    getChildContext() {
      const childContext =  {
        store: this.store
      };
      for (let key in injector._services) {
        childContext[key] = injector._services[key];
      }
      for (let key in globalInjector._services) {
        if (childContext[key] === undefined) {
          childContext[key] = globalInjector._services[key];
        }
      }

      return childContext;
    }
  }

  IProvider.childContextTypes = Provider.childContextTypes;
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
