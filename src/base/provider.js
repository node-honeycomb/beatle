import React, {createContext} from 'react';
import {Provider} from 'react-redux';

export default function getProvider(injector, globalInjector) {
  const childContext = createContext();
  class IProvider extends Provider {
    constructor(props, context) {
      super(props, context);

      this._services = {};
      for (let key in injector._services) {
        this._services[key] = injector._services[key];
      }
      for (let key in globalInjector._services) {
        if (this._childContext[key] === undefined) {
          this._services[key] = globalInjector._services[key];
        }
      }
    }

    render() {
      const children = super.render();
      return (<childContext.Provider value={this._services}>{children}</childContext.Provider>)
    }
  }

  return IProvider;
}
