import hook from './hook'
import Ctrl from '../#types/Ctrl'

export default hook('useValue', useValue)

function useValue<T>(c: Ctrl, initialValue: T):
  [{ value: T }, (updater: (T | ((value: T) => T))) => void]
{
  let nextValue = initialValue
  
  const
    value = { value: initialValue },
  
    setValue = (updater: any) => { // TODO
      nextValue = typeof updater === 'function'
        ? updater(nextValue)
        : updater

      c.update(() => {
        value.value = nextValue
      })
    }

  return [value, setValue as any] // TODO
}
