
import hook from './hook'
import globals from '../internal/globals'
export default hook('useState', initialState => {
  let
    nextState,
    mergeNecessary = false

  const
    c = globals.currentComponent,
    state = { ...initialState },

    setState = (arg1, arg2) => {
      mergeNecessary = true

      if (typeof arg1 === 'string') {
        nextState[arg1] =
          typeof arg2 === 'function'
            ? arg2(nextState[arg1])
            : arg2
      } else if (typeof arg1 === 'function') {
        Object.assign(nextState, arg1(nextState))
      } else {
        Object.assign(nextState, arg1)
      }

      c._update(() => {
        if (mergeNecessary) {
          Object.assign(state, nextState)
          mergeNecessary = false
        }
      })
    }

  nextState = { ...state }

  /*
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
    */

  return [state, setState]
})
