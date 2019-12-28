export default function useValue(c, initialValue) {
  const
    value = { value: initialValue },

    setValue = updater => {
      c.update(() => {
        value.value = typeof updater === 'function'
          ? updater(value.value)
          : updater
      })
    }

  return [value, setValue]
}
