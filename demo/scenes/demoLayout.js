import React from 'react';
import PropTypes from 'prop-types';
import Button from 'antd/lib/button';
import Icon from 'antd/lib/icon';
import Card from 'antd/lib/card';
import {GlobalFooter, BasicLayout} from 'hc-components';

export default class DemoLayout extends BasicLayout {
  static displayName = 'DemoLayout';

  static getLayoutProps = function (option, viewContent) {
    const navs = [];
    if (option.route) {
      let route = option.route;
      navs.push({
        text: route.title
      });
      if (route.navKey && option.subRoutes[route.navKey]) {
        navs.unshift({
          text: option.subRoutes[route.navKey].title || route.navKey
        });
      }
      while ((route = route.parent) && route.title) {
        navs.unshift({link: route.resolvePath, text: route.title});
      }
    }
    return BasicLayout.getLayoutProps.call(this, option, viewContent, {BreadCrumb: option.BreadCrumb === false ? option.BreadCrumb : Object.assign({navs: navs}, option.BreadCrumb)});
  }

  static layoutBlocks = {
    Footer: GlobalFooter,
  }

  static propTypes = {
    route: PropTypes.object
  }

  state = {
    visible: false
  }

  render() {
    const route = this.props.route;
    const Footer = this.getComponent('Footer');
    return (
      <div className={'j-layout-demo ' + this.props.className} style={{margin: 100}}>
        <div className="j-content">
          <i className="j-doc-trigger"></i>
          <p className="j-doc" dangerouslySetInnerHTML={{__html: route.doc}} />
          <Card title={(<h3>{route.title}<small style={{marginLeft: 10}}>{route.summary}</small></h3>)} style={{marginTop: 50}} extra={(<Button type="ghost" size="small" onClick={() => this.setState({visible: !this.state.visible})}><Icon type="eye" />wiki</Button>)}>
            {this.state.visible ? (<iframe style={{
              textAlign: 'left',
              marginTop: 20,
              border: '1px solid #ddd',
              width: '100%'
            }}
            onLoad={(e) => {
              e.target.style.height = (e.target.contentDocument.documentElement.scrollHeight + 10) + 'px';
            }}
            src={route ? window.CONFIG.prefix + '/assets/static/' + route.fpath.slice(2, -4).replace(/[\\/]/g, '_').replace('_index', '_demo') + '.html' : 'about:blank'}
            >
            </iframe>) : null}
            {this.props.viewContent || this.props.children}
          </Card>
        </div>
        <Footer className="j-footer" />
      </div>
    );
  }
}
