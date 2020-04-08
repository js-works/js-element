import globals from '../internal/globals'
export default function hook(name, fn) {
  const ret = function () {
    if (!globals.currentCtrl) {
      throw new Error(`Hook function "${name}" can only be invoked in component initialization phase`)
    }

    globals.hasUsedHooks = true

    return fn.apply(null, arguments)
  }

  Object.defineProperty(ret, 'name', {
    value: name
  })

  return ret
}