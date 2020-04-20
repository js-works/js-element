import hook from './hook'
import globals from '../internal/globals'
export default hook('useValue', initialValue => {
  const
    c = globals.currentComponent,
    value = { value: initialValue },

    setValue = updater => {
      c._update(() => {
        value.value = typeof updater === 'function'
          ? updater(value.value)
          : updater
      })
    }

  return [value, setValue]
})
