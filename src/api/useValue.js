export default function useValue(c, initialValue) {
  const
    value = { value: initialValue },

    setValue = updater => {
      const unsubscribe = c.beforeRefresh(() => {
        unsubscribe()

        value.value = typeof updater === 'function'
          ? updater(value.value)
          : updater
      })

      c.refresh()
    }

  return [value, setValue]
}
