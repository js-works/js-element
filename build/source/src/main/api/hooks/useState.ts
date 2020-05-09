import hook from './hook'
import Ctrl from '../#types/Ctrl'

export default hook('useState', useState)

type Updater<T extends Record<string, any>> = {
  (newState: Partial<T>): void,
  (stateUpdate: (oldState: T) => Partial<T>): void,
  (key: keyof T, newValue: T[typeof key]): void,
  (key: keyof T, valueUpdate: (oldValue: T[typeof key]) => T[typeof key]): void
}

function useState<T extends Record<string, any>>(
  c: Ctrl,
  initialState: T
): [T, Updater<T>] {
  let
    nextState: any, // TODO
    mergeNecessary = false

  const
    state = { ...initialState },

    setState = (arg1: any, arg2: any) => {
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

      c.update(() => {
        if (mergeNecessary) {
          Object.assign(state, nextState)
          mergeNecessary = false
        }
      })
    }

  nextState = { ...state }

  return [state, setState as any] // TODO
}
