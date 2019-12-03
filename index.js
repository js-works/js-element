'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/js-elements.umd.production.js')
} else {
  module.exports = require('./dist/js-elements.umd.development.js')
}
