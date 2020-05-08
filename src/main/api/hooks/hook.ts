import Ctrl from '../#types/Ctrl'

export default function hook<
  F extends (c: Ctrl<any>, ...args: any[]) => any,
>(name: string, func: F): F {
  function ret() {
    const firstArg = arguments[0]

    if (!firstArg || !firstArg.afterMount || !firstArg.isMounted) { // TODO
      throw new TypeError(`Hook function "${name}" has been called without component controller as first argument`)
    } else if (firstArg.isInitialized()) {
      throw new Error(`Hook function "${name}" can only be invoked in component initialization phase`)
    }

    return func.apply(null, arguments as any)
  }

  // just to give the hook function a real name
  Object.defineProperty(ret, 'name', {
    value: name
  })

  return ret as any
}
