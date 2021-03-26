'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/js-element-uhtml.cjs.production.js')
} else {
  module.exports = require('./dist/js-element-uhtml.cjs.development.js')
}
