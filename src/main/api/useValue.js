import hook from './hook'
export default hook('useValue', (c, initialValue) => {
  let nextValue = initialValue
  
  const
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

      c.update(() => {
        value.value = nextValue
      })
    }

  return [value, setValue]
})
