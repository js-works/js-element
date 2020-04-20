import globals from '../internal/globals'
export default function hook(name, fn) {
  function ret() {
    if (!globals.currentComponent) {
      throw new Error(`Hook function "${name}" can only be invoked in component initialization phase`)
    }

    return fn.apply(null, arguments)
  }

  Object.defineProperty(ret, 'name', {
    value: name
  })

  return ret
}
