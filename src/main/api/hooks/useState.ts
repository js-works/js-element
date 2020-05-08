import hook from './hook'
import Ctrl from '../#types/Ctrl'

export default hook('useState', useState)

function useState<T extends Record<string, any>>(
  c: Ctrl,
  initialState: T
): any // TODO 

//[T, ((key: keyof T, value: T[typeof key]) => void)
// | ((key: keyof T, mapper: (value: T[typeof key]) => T[typeof key]) => void)
// | ((updater: (Partial<T> | ((state: T) => Partial<T>))) => void)]
{
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
