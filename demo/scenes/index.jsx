import React from 'react';
import PropTypes from 'prop-types';
import Beatle from '../../src';

import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Card from 'antd/lib/card';
import marked from 'marked';
import Modal from 'antd/lib/modal';
import DocumentTitle from 'react-document-title';
import DemoLayout from './demoLayout';

import {getLayout, GModal, Sider} from 'hc-components';

export default class Root extends React.PureComponent {
  static contextTypes = {
    app: PropTypes.object
  }

  static routeOptions = true

  static propTypes = {
    children: PropTypes.element
  }

  state = {
    subMenus: null
  }

  get layoutOption() {
    const option = {
      routes: this.context.app.getRoutes()[0].childRoutes,
      // Link组件
      Link: Beatle.Link
    };
    return Object.assign(option, {
      subRoutes: [],
      // Sider组件
      Sider: false,
      // 默认面包屑
      BreadCrumb: false,
      // 不要header组件
      Header: false,
      // 不要页尾
      Footer: false,
      components: {
        Header: [Sider, Object.assign(option, {
          header: {
            style: {position: 'fixed', zIndex: 100000, width: '100%'}
          },
          orderKeys: ['single', 'spa', 'complex', 'core'],
          subMenus: {
            single: {
              title: '单组件应用',
              category: 'beatle'
            },
            spa: {
              title: 'SPA应用',
              category: 'beatle'
            },
            complex: {
              title: '复杂应用',
              category: 'beatle'
            },
            core: {
              title: 'Beatle核心模块',
              category: 'core'
            }
          },
          ref: inst => inst && !this.state.subMenus && this.setState({subMenus: inst.state.subMenus}),
          menu: {
            mode: 'horizontal'
          },
          getResolvePath: Beatle.getResolvePath,
          brand: {
            title: 'Beatle项目示例',
            logo: '//img.alicdn.com/tfs/TB14dINRpXXXXcyXXXXXXXXXXXX-64-64.png?t=1517212583908'
          }
        })]
      }
    });
  }

  getOverview() {
    const subMenus = this.state.subMenus || {};
    const exmplesMap = {
      beatle: {
        title: '启动一个Beatle项目',
        mods: []
      },
      core: {
        title: '应用一个Beatle核心模块',
        mods: []
      },
      // other: {
      //   title: '深入学习一种技术',
      //   mods: []
      // },
    };
    Object.keys(subMenus).forEach(key => {
      subMenus[key].key = key;
      exmplesMap[subMenus[key].category].mods.push(subMenus[key]);
    });
    const desc = marked(require('raw-loader!!!./README.md').trim());
    return (
      <div style={{margin: 100}}>
        <p className="j-doc" dangerouslySetInnerHTML={{__html: desc}} />
        {Object.keys(exmplesMap).map(key => {
          const map = exmplesMap[key];
          return (<div key={key}>
            <h1 style={{marginTop: 50}}>{map.title}</h1>
            {map.mods.map(mod => {
              return (<Card key={mod.key} title={mod.title}>
                <Row>
                  {mod.children.map((route, index) => {
                    return (<Col key={index} span={4}>
                      <div className="elem-icon">
                        <Beatle.Link to={route.resolvePath}>
                          <div dangerouslySetInnerHTML={{__html: route.getIcon(50)}} />
                          <h3>{route.title}</h3>
                          <p>{route.summary}</p>
                        </Beatle.Link>
                      </div>
                    </Col>);
                  })}
                </Row>
              </Card>);
            })}
          </div>);
        })}
      </div>
    );
  }

  render() {
    const viewContent = this.props.children || this.getOverview();
    const route = this.props.children && this.props.children.props.route;
    const layout = getLayout({
      layoutOption: this.layoutOption,
      layout: 'ConsoleLayout',
      route: route
    }, viewContent, {
      demoLayout: DemoLayout
    });
    return (
      <DocumentTitle title={(route ? route.component && route.component.routeOptions.title + ' - ' : '') + '示例'}>
        <div className="j-scene-all">
          <div className="j-scene-root">
            {layout}
            <GModal width={600} component={Modal} />
          </div>
        </div>
      </DocumentTitle>
    );
  }
}
