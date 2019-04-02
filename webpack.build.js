var path = require('path');
var DoccoPlugin =  require('damo-cli-docco-plugin');

const vendors = [
  'antd',
  'seamless-immutable',
  'core-js',
  'react',
  'prop-types',
  'react-dom',
  'react-redux',
  'react-router',
  'react-router',
  'react-router-config',
  'react-router-redux',
  'redux-logger',
  'redux-thunk',
  'react-intl',
  'react-mixin',
  'react-addons-pure-render-mixin',
  'create-react-class',
  'cuid',
  'redux',
  'redux-promise-middleware',
  'react-redux-loading-bar',
  'hoist-non-react-statics',
  'async-validator',
  'isomorphic-fetch',
  'events',
  'moment',
  'querystring',
  'url',
  'bluebird',
  'qs',
  'warning',
  /rxjs\/*/,
  /history\/*/,
  /lodash\/*/,
  /fbjs\/*/,
  /react-router\/*/,
  /redux-saga\/*/
];

var webpackOpts = {
  entry: {
    app: './src/index.js'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            presets: ['env', 'react'],
            plugins: [
              'transform-decorators-legacy',
              'transform-class-properties',
              'add-module-exports',
              'transform-object-rest-spread',
              [path.resolve(__dirname, 'node_modules/babel-plugin-transform-runtime'), {
                polyfill: false,
                regenerator: true
              }],
              [path.resolve(__dirname, 'node_modules/babel-plugin-transform-async-to-module-method'), {
                module: 'bluebird',
                method: 'coroutine'
              }]
            ],
          }
        }
      }
    ]
  },
  output: {
    filename: 'beatle.js',
    path: path.resolve(__dirname, 'dist/core'),
    library: 'beatle',
    libraryTarget: 'commonjs2'
  },
  externals: vendors,
  // 开发者工具
  // cheap-eval-source-map 打开source
  // inline-source-map 调试的时候需要，为每个文件加一个sourcemap的DataUrl，ps：是打包前的每个文件
  devtool: '#cheap-source-map',
  plugins: [
    // define插件，可以做环境变量，代码切分等功能(这里需要拓展)
    // new webpack.DefinePlugin({'process.env.NODE_ENV': JSON.stringify('development')}),
    // 把静态资源注入html的plugins
    // new HtmlWebpackPlugin({template: path.resolve(__dirname, './assets/index.html')}),
    // 代码压缩插件
    // new webpack.optimize.UglifyJsPlugin({sourceMap: true}),
    // js抽离逻辑
    // new webpack.optimize.CommonsChunkPlugin({names: ['public', 'vendor'], minChunks: 2})
    new DoccoPlugin({dir: './src', output: path.resolve('./dist/docs')})
  ],
  unPlugins: [
    'DefinePlugin',
    'UglifyJsPlugin',
    'CommonsChunkPlugin'
  ]
};

module.exports = webpackOpts;
