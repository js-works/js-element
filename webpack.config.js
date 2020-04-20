const
  CleanupPlugin = require('webpack-cleanup-plugin'),
  UglifyJsPlugin = require('uglifyjs-webpack-plugin'),
  TerserPlugin = require('terser-webpack-plugin'),
  CompressionPlugin = require('compression-webpack-plugin'),
  ZipPlugin = require('zip-webpack-plugin'),
  path = require('path'),

  libraryTargetMap = {
    cjs: 'commonjs2',
    umd: 'umd',
    esm: 'commonjs-module'
  }

module.exports = [
  createConfig('cjs', 'development', false, true), // TODO
  createConfig('cjs', 'production'),
  
  createConfig('umd', 'development'),
  createConfig('umd', 'production'),
  
  createConfig('esm', 'development'),
  createConfig('esm', 'production')
]

function createConfig(moduleType, mode, cleanup = false, zip = false) {
  const
    isProd = mode === 'production',

    externals = {
      //'lit-html': 'litHTML'
    }

  return {
    entry: './src/main/index.js',
    mode,

    output: {
      library: 'jsElements',
      libraryTarget:  libraryTargetMap[moduleType],
      path: path.resolve(__dirname, 'dist'),
      filename: `js-elements.${moduleType}.${mode}.js`
    },

    externals,

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

    plugins: [
      ...(!cleanup ? [] : [new CleanupPlugin()]),
      ...(!isProd ? [] : [new CompressionPlugin()]),

      ...(!zip ? [] : [
        new ZipPlugin({
          filename: 'source.zip',
          exclude: ['node_modules', '.git', 'dist'],
        })
      ])
    ],

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
    },


  }
}
