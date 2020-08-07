'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('../dist/js-elements.ext.cjs.production.js')
} else {
  module.exports = require('../dist/js-elements.ext.cjs.development.js')
}
