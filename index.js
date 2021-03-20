'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/js-element.cjs.production.js')
} else {
  module.exports = require('./dist/js-element.cjs.development.js')
}
