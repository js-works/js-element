const
  UglifyJsPlugin = require('uglifyjs-webpack-plugin'),
  TerserPlugin = require('terser-webpack-plugin'),
  CompressionPlugin = require('compression-webpack-plugin'),
  path = require('path')

module.exports = [
  createConfig('esm', 'development'),
  createConfig('esm', 'production')
]

function createConfig(moduleType, mode) {
  const isProd = mode === 'production'

  return {
    entry: './src/index.js',
    mode,

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: `js-mojo.${moduleType}.${mode}.js`
    },

    externals: {
      'lit-html': 'litHtml'
    },

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel-loader',

          options: {
            presets: [
              ['@babel/preset-env']
            ]
          }
        }
      ]
    },

    plugins: isProd ? [new CompressionPlugin()] : [],

    optimization: {
      minimize: true,
      
      minimizer: [
        new TerserPlugin({
          extractComments: false,

          terserOptions: {
            output: {
              comments: false
            }
          }
        })
      ]
      
      //new UglifyJsPlugin()
    }
  }
}
