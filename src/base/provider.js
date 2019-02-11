import {Provider} from 'react-redux';

export default function getProvider(injector, globalInjector) {
  class IProvider extends Provider {
    constructor(props, context) {
      super(props, context);

      for (let key in injector._services) {
        this.state[key] = injector._services[key];
      }
      for (let key in globalInjector._services) {
        if (this._childContext[key] === undefined) {
          this.state[key] = globalInjector._services[key];
        }
      }
    }
  }

  return IProvider;
}
