export default function useState(c, initialState) {
  const
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

      const unsubscribe = c.beforeUpdate(() => {
        unsubscribe()

        Object.assign(state, typeof updater === 'function'
          ? updater(state)
          : updater
        )
      })

      c.update()
    }

  return [state, setState]
}
