import hook from './hook'
import globals from '../internal/globals'
export default hook('useValue', initialValue => {
  let nextValue = initialValue
  
  const
    c = globals.currentComponent,
    value = { value: initialValue },
  
    /*
        setValue = updater => {
          c._update(() => {
            value.value = typeof updater === 'function'
              ? updater(value.value)
              : updater
          })
        }
    */

    setValue = updater => {
      nextValue = typeof updater === 'function'
        ? updater(nextValue)
        : updater

      c._update(() => {
        value.value = nextValue
      })
    }

  return [value, setValue]
})
