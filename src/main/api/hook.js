export default function hook(name, fn) {
  function ret() {
    const firstArg = arguments[0]

    if (!firstArg || !firstArg.afterMount || !firstArg.isMounted) {
      throw new TypeError(`Hook function "${name}" has been called without component controller as first argument`)
    } else if (firstArg.isInitialized()) {
      throw new Error(`Hook function "${name}" can only be invoked in component initialization phase`)
    }


    return fn.apply(null, arguments)
  }

  Object.defineProperty(ret, 'name', {
    value: name
  })

  return ret
}
