
import hook from './hook'
import globals from '../internal/globals'
export default hook('useState', initialState => {
  const
    c = globals.currentComponent,
    state = { ...initialState },

    setState = (arg1, arg2) => {
      let updater

      if (typeof arg1 !== 'string') {
        updater = arg1
      } else if (typeof arg2 !== 'function') {
        updater = { [arg1]: arg2 }
      } else {
        updater = state => ({
          [arg1]: arg2(state[arg1])
        })
      } 

      c._update(() => {
        Object.assign(state, typeof updater === 'function'
          ? updater(state)
          : updater
        )
      })
    }

  return [state, setState]
})
