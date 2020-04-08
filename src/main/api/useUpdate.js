import hook from './hook'
import globals from '../internal/globals'
export default hook('useUpdate', () => {
  const c = globals.currentCtrl

  return () => c.update()
})
