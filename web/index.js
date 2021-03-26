'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/js-element-web.cjs.production.js.js.js')
} else {
  module.exports = require('./dist/js-element-web.cjs.development.js.js.js')
}
