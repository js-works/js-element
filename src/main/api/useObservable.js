import ObservableSlim from 'observable-slim'
import hook from './hook'
import globals from '../internal/globals'
export default hook('useObservable', initialState => {
  const c = globals.currentComponent

  return ObservableSlim.create(initialState, true, () => c._update())
})
