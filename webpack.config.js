var path = require('path');
var _ = require('lodash');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var AutoModulePlugin = require('@ali/auto-router-plugin');
const vendors = [
  "antd",
  "seamless-immutable",
  "core-js",
  "react",
  "prop-types",
  "react-dom",
  "react-redux",
  "react-router",
  "redux-router",
  "react-router-redux",
  "redux-logger",
  "redux-thunk",
  "react-intl",
  "react-mixin",
  "cuid",
  "redux",
  "redux-promise-middleware",
  "react-redux-loading-bar",
  "hoist-non-react-statics",
  "recompose",
  "reselect",
  "async-validator",
  "isomorphic-fetch",
  "events",
  "lodash",
  "moment"
];

var webpackOpts = {
  entry: {
    app: './example/src/app.jsx',
    vendor: vendors
  },
  output: {
    filename: '[name].js',
    chunkFilename: '[name].js',
    path: path.resolve(__dirname, 'example/build')
  },
  // 开发者工具
  // cheap-eval-source-map 打开source
  // inline-source-map 调试的时候需要，为每个文件加一个sourcemap的DataUrl，ps：是打包前的每个文件
  devtool: '#cheap-source-map',
  plugins: [
    new webpack.ProgressPlugin(),
    // define插件，可以做环境变量，代码切分等功能(这里需要拓展)
    new webpack.DefinePlugin({'process.env.NODE_ENV': JSON.stringify('development')}),
    // 把静态资源注入html的plugins
    new HtmlWebpackPlugin({template: path.resolve(__dirname, './example/index.html')}),
    // 代码压缩插件
    // new webpack.optimize.UglifyJsPlugin({sourceMap: true}),
    // js抽离逻辑
    new webpack.optimize.CommonsChunkPlugin({names: ['public', 'vendor'], minChunks: 2}),

    new AutoModulePlugin({
      basePath: path.resolve(process.cwd()), //前端目录的base路径
      modelsPath: path.resolve(process.cwd(),'./example/src/models'), // models目录的路径
      scenesPath: path.resolve(process.cwd(),'./example/src/scenes'), // scenes目录的路径
      extensions: ['jsx', 'js']  // 识别文件类型
    }),
  ],
  devServer: {
    stats: "errors-only",
    open: true
  },
  unPlugins: []
};

module.exports = webpackOpts;
