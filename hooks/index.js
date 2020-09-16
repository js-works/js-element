'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('../dist/js-elements-hooks.cjs.production.js')
} else {
  module.exports = require('../dist/js-elements-hooks.cjs.development.js')
}
