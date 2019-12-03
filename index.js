'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/js-elements.cjs.production.js')
} else {
  module.exports = require('./dist/js-elements.cjs.development.js')
}
