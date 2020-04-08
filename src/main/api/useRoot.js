import hook from './hook'
import globals from '../internal/globals'
export default hook('useRoot', () => {
  return globals.currentCtrl.getRoot()
})
