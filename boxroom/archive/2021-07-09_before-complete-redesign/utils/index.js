'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/js-element-utils.cjs.production.js')
} else {
  module.exports = require('./dist/js-element-utils.cjs.development.js')
}
