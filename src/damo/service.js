import PropTypes from 'prop-types';
import warning from 'fbjs/lib/warning';
import logMessages from '../core/messages';

export default function service(providers, Component, {injector, selector}) {
  // + 获取HOC包装的组件的实例 > see:
  // https://github.com/RubaXa/Sortable/issues/713#issuecomment-169668921
  function getParantService(name) {
    return this._reactInternalInstance ? this._reactInternalInstance._context[name] : null;
  }
  // 优先级为：providers -> context -> parentContext -> globalService
  function getService(name) {
    const service = this._services && this._services[name] || this.context[name];
    return service || getParantService.call(this, name) || injector.getService(name);
  }

  class NewComponent extends Component {
    constructor(props, context) {
      super(props, context);
      const services = this._services = {
        selector: selector
      };

      NewComponent.childContextTypes = NewComponent.childContextTypes || {};
      NewComponent.childContextTypes.selector = PropTypes.object;
      if (Array.isArray(providers)) {
        providers.forEach(Provider => {
          warning(Provider.displayName, logMessages.displayName, 'contructor', 'service', 'Beatle-pro');
          NewComponent.childContextTypes[Provider.displayName] = PropTypes.object;
          services[Provider.displayName] = injector.instantiate(Provider, Provider.displayName, getService.bind(this));
        });
      } else {
        for (let name in providers) {
          NewComponent.childContextTypes[name] = PropTypes.object;
          services[name] = injector.instantiate(providers[name], name, getService.bind(this));
        }
      }

      if (context.selector) {
        services.parentSelector = context.selector;
        context.selector = selector;
      }
      // 提升当前组件的context的优先级
      for (let name in context) {
        if (services[name] !== undefined) {
          context[name] = services[name];
        }
      }

      if (selector) {
        // context也从当前组件同一个级别
        for (let name in selector.context) {
          if (name === 'props') {
            // 每次获取props都是最新的
            Object.defineProperty(selector.context, 'props', {
              get: () => {
                return this.props;
              },
              enumerable: true,
              configurable: true
            });
          } else {
            selector.context[name] = getService.call(this, name);
          }
        }

        // 完成后触发钩子函数
        try {
          selector.initialize && selector.initialize(this.props);
        } catch (e) {
          window.console.error(e);
        }
      }
    }

    getChildContext() {
      // 子组件可以获取到providers注入的服务
      if (super.getChildContext) {
        const childContext = super.getChildContext();
        return Object.assign(childContext, this._services);
      } else {
        return this._services;
      }
    }

    componentWillUnmount() {
      super.componentWillUnmount && super.componentWillUnmount();
      const services = this._services;
      for (let name in services) {
        if (services[name].destroy) {
          services[name].destroy();
        }
        if (services[name].dispose) {
          services[name].dispose();
        }
      }
    }
  }
  return NewComponent;
}
