import hook from './hook'
import globals from '../internal/globals'
export default hook('useMethods', methods => {
  globals.currentComponent._methods = methods
})
