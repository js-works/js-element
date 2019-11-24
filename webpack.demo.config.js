const path = require('path')

module.exports = {
  entry: './demo/demo.js',
  mode: 'development',

  output: {
    filename: './demo.js'
  },

  devServer: {
    contentBase: path.join(__dirname, 'demo'),
    watchContentBase: true,
    open: true,
    port: 9000,
    liveReload: true
  }
}
