import { intercept, Ctrl, Ctx, Listener } from 'js-element'

// === data ==========================================================

let baseInterceptorAdded = false
let observerInterceptorAdded = false
let currentCtrl: Ctrl | null = null

// === types =========================================================

type State = Record<string, any>
type Task = () => void
type Methods = Record<string, (...args: any[]) => any>

type StateUpdater<T extends Record<string, any>> = {
  (newState: Partial<T>): void
  (stateUpdate: (oldState: T) => Partial<T>): void
  (key: keyof T, newValue: T[typeof key]): void
  (key: keyof T, valueUpdate: (oldValue: T[typeof key]) => T[typeof key]): void
}

type Message = { type: string } & Record<string, any>

type MessageCreators = {
  [key: string]: (...args: any[]) => Message
}

type CtxConfig = Record<string, Ctx<any> | (() => any)>

type ResultOfCtxConfig<C extends CtxConfig> = {
  [K in keyof C]: C[K] extends Ctx<infer R>
    ? R
    : C[K] extends () => infer R
    ? R
    : never
}

// === hook ====================================================

export function hook<A extends any[], R, F extends { (...args: A): R }>(
  name: string,
  fn: F
): F {
  if (!baseInterceptorAdded) {
    intercept(
      'init',
      (() => {
        return (c: Ctrl, next: () => void) => {
          currentCtrl = c

          try {
            next()
          } finally {
            currentCtrl = null
          }
        }
      })()
    )

    baseInterceptorAdded = true
  }

  return ((...args: any): any => {
    if (!currentCtrl) {
      throw new Error(
        `Hook function "${name}" has been invoked outside of component initialization phase`
      )
    }

    return fn(...args)
  }) as any
}

// === useHost =======================================================

export const useHost = hook('useHost', () => {
  return currentCtrl!.getHost()
})

// === useRefresher ==================================================

export const useRefresher = hook('useRefresher', function (): Task {
  return currentCtrl!.refresh
})

// === useStatus =====================================================

export const useStatus = hook('useStatus', function (): {
  isMounted: () => boolean
  hasUpdated: () => boolean
} {
  const c = currentCtrl!

  return {
    isMounted: c.isMounted,
    hasUpdated: c.hasUpdated
  }
})

// === useDefault ====================================================

export const useDefaults = hook('useDefaults', function <
  P extends Record<string, any>,
  D extends Partial<P>
>(props: P, defaults: D): P & Required<D> {
  const c = currentCtrl!

  const ret = Object.assign({}, defaults, props)

  c.beforeUpdate(() => {
    for (const key in ret) {
      delete ret[key]
    }

    Object.assign(ret, defaults, props)
  })

  return ret as any
})

// === useValue ======================================================

export const useValue = hook('useValue', function <T>(initialValue: T): [
  () => T,
  (updater: T | ((value: T) => T)) => void
] {
  let nextValue = initialValue
  let value = initialValue

  const c = currentCtrl!
  const setValue = (updater: any) => {
    // TODO
    nextValue = typeof updater === 'function' ? updater(nextValue) : updater

    c.onceBeforeUpdate(() => {
      value = nextValue
    })

    c.refresh()
  }

  return [() => value, setValue as any] // TODO
})

// === useState =======================================================

export const useState = hook('useState', function <
  T extends Record<string, any>
>(initialState: T): [T, StateUpdater<T>] {
  let nextState: any, // TODO
    mergeNecessary = false

  const c = currentCtrl!

  const state = { ...initialState },
    setState = (arg1: any, arg2: any) => {
      mergeNecessary = true

      if (typeof arg1 === 'string') {
        nextState[arg1] =
          typeof arg2 === 'function' ? arg2(nextState[arg1]) : arg2
      } else if (typeof arg1 === 'function') {
        Object.assign(nextState, arg1(nextState))
      } else {
        Object.assign(nextState, arg1)
      }

      c.onceBeforeUpdate(() => {
        if (mergeNecessary) {
          Object.assign(state, nextState)
          mergeNecessary = false
        }
      })

      c.refresh()
    }

  nextState = { ...state }

  return [state, setState as any] // TODO
})

// === useStyles =======================================================

function addStyles(
  stylesContainer: Element,
  styles: string[] | HTMLStyleElement
): void {
  if (styles instanceof HTMLStyleElement) {
    stylesContainer.appendChild(styles)
  } else {
    const css = styles.join('\n\n/* =============== */\n\n')
    const styleElem = document.createElement('style')

    styleElem.appendChild(document.createTextNode(css))
    stylesContainer.appendChild(styleElem)
  }
}

export const useStyles = hook('useStyles', (...styles: string[]) => {
  const c = currentCtrl!

  const ret = (...styles: string[]) => {
    addStyles(c.getHost().shadowRoot!.firstChild as Element, styles)
  }

  ret.apply(null, styles)

  return ret
})

// === useEmitter ======================================================

function useEmitterFn(): (ev: CustomEvent<any>) => void
function useEmitterFn<D = void>(type: string): (detail: D) => void
function useEmitterFn<T extends string, D>(
  type: T,
  getEventProp: () => Listener<CustomEvent<D> & { type: T }> | undefined
): (detail: D) => void

function useEmitterFn(type?: string, getEventProp?: Function) {
  const host = useHost()

  if (arguments.length > 0 && typeof type !== 'string') {
    throw new Error('[useEmitter] Invalid type of first argument')
  }

  if (type === undefined) {
    return (ev: CustomEvent<any>) => host.dispatchEvent(ev)
  }

  if (getEventProp) {
    const eventListener = (ev: Event) => {
      const eventProp = getEventProp()

      eventProp && eventProp(ev)
    }

    useAfterMount(() => {
      host.addEventListener(type, eventListener)

      return () => host.removeEventListener(type, eventListener)
    })
  }

  return <D>(detail: D, options?: CustomEventInit<D>) => {
    const ev = new CustomEvent<D>(type, {
      bubbles: true,
      composed: true,
      cancelable: true,
      ...options,
      detail
    })

    host.dispatchEvent(ev)
  }
}

export const useEmitter = hook('useEmitter', useEmitterFn)

// === useMemo =========================================================

// TODO - this is not really optimized, is it?

export const useMemo = hook('useMemo', function <
  T,
  A extends any[],
  G extends () => A
>(getValue: (...args: ReturnType<G>) => T, getDeps: G) {
  let oldDeps: any[], value: T

  const memo = {
    get value() {
      const newDeps = getDeps()

      if (!oldDeps || !isEqualArray(oldDeps, newDeps)) {
        value = getValue.apply(null, newDeps as any) // TODO
      }

      oldDeps = newDeps
      return value
    }
  }

  return memo
})

// === useAfterMount ====================================================

export const useAfterMount = hook(
  'useAfterMount',
  function (action: () => void | undefined | null | (() => void)) {
    let cleanup: Task | null | undefined | void
    const c = currentCtrl!

    c.afterMount(() => {
      cleanup = action()
    })

    c.beforeUnmount(() => {
      if (typeof cleanup === 'function') {
        cleanup()
      }

      cleanup = null
    })
  }
)

// === useBeforeRender ===============================================

export const useBeforeRender = hook(
  'useBeforeRender',
  function (action: () => void | undefined | null | (() => void)) {
    let cleanup: Task | null | undefined | void = null
    const c = currentCtrl!

    const task = () => {
      cleanup && cleanup()
      cleanup = action()
    }

    c.beforeMount(task)
    c.beforeUpdate(task)

    c.beforeUnmount(() => {
      cleanup && cleanup()
      cleanup = null
    })
  }
)

// === useBeforeUpdate ===============================================

export const useBeforeUpdate = hook(
  'useBeforeUpdate',
  function (action: () => void | undefined | null | (() => void)) {
    let cleanup: Task | null | undefined | void = null
    const c = currentCtrl!

    c.beforeUpdate(() => {
      cleanup && cleanup()
      cleanup = action()
    })

    c.beforeUnmount(() => {
      cleanup && cleanup()
      cleanup = null
    })
  }
)

// === useBeforeMount ====================================================

export const useBeforeMount = hook(
  'useBeforeMount',
  function (action: () => void | undefined | null | (() => void)) {
    let cleanup: Task | null | undefined | void
    const c = currentCtrl!

    c.beforeMount(() => {
      cleanup = action()
    })

    c.afterUpdate(() => {
      if (typeof cleanup === 'function') {
        cleanup()
      }
    })

    c.beforeUnmount(() => {
      if (typeof cleanup === 'function') {
        cleanup()
      }

      cleanup = null
    })
  }
)

// === useAfterUpdate ===================================================

export const useAfterUpdate = hook(
  'useAfterUpdate',
  function (action: () => void | undefined | null | (() => void)) {
    let cleanup: Task | null | undefined | void
    const c = currentCtrl!

    c.afterUpdate(() => {
      if (typeof cleanup === 'function') {
        cleanup()
      }

      cleanup = action()
    })

    c.beforeUnmount(() => {
      if (typeof cleanup === 'function') {
        cleanup()
      }

      cleanup = null
    })
  }
)

// === useBeforeUnmount ==================================================

export const useBeforeUnmount = hook(
  'useBeforeUnmount',
  function (action: () => void) {
    currentCtrl!.beforeUnmount(action)
  }
)

// === useAfterInit =====================================================

export const useOnInit = hook('useOnInit', function (action: () => void) {
  const c = currentCtrl!
  const done = false

  c.beforeMount(() => {
    if (done) {
      return
    }

    action()
  })
})

// === usePreEffect =====================================================

export const usePreEffect = hook(
  'usePreEffect',
  function (
    action: () => void | undefined | null | (() => void),
    getDeps?: () => any[]
  ): void {
    let oldDeps: any[] | null = null
    let cleanup: Task | null | undefined | void
    const c = currentCtrl!

    const callback = () => {
      let needsAction = getDeps === undefined

      if (!needsAction) {
        const newDeps = getDeps!()

        needsAction =
          oldDeps === null ||
          newDeps === null ||
          !isEqualArray(oldDeps, newDeps)

        oldDeps = newDeps
      }

      if (needsAction) {
        cleanup && cleanup()
        cleanup = action()
      }
    }

    c.beforeMount(callback)
    c.beforeUpdate(callback)
    c.beforeUnmount(() => cleanup && cleanup())
  }
)

// === useEffect =====================================================

export const useEffect = hook(
  'useEffect',
  function (
    action: () => void | undefined | null | (() => void),
    getDeps?: () => any[]
  ): void {
    let oldDeps: any[] | null = null
    let cleanup: Task | null | undefined | void
    const c = currentCtrl!

    const callback = () => {
      let needsAction = getDeps === undefined

      if (!needsAction) {
        const newDeps = getDeps!()

        needsAction =
          oldDeps === null ||
          newDeps === null ||
          !isEqualArray(oldDeps, newDeps)

        oldDeps = newDeps
      }

      if (needsAction) {
        cleanup && cleanup()
        cleanup = action()
      }
    }

    c.afterMount(callback)
    c.afterUpdate(callback)
    c.beforeUnmount(() => cleanup && cleanup())
  }
)

// === useInterval ======================================================

export const useInterval = hook(
  'useInterval',
  (task: Task, delay: number | (() => number)) => {
    const getDelay = typeof delay === 'function' ? delay : () => delay

    useEffect(
      () => {
        const id = setInterval(task, getDelay())

        return () => clearInterval(id)
      },
      () => [getDelay()]
    )
  }
)

// === useTimer ========================================================

type TimerSignature = {
  (delay: number | (() => number)): () => Date
  <T>(delay: number | (() => number), getValue: (n: number) => T): () => T
}

export const useTimer = hook(
  'useTimer',
  (delay: number | (() => number), get: (n: number) => any = getDate) => {
    let idx = 0
    const getDelay = typeof delay === 'function' ? delay : () => delay
    const [getValue, setValue] = useValue(get(idx++))

    useInterval(
      () => {
        setValue(get(idx++))
      },
      () => getDelay()
    )

    return getValue
  }
) as TimerSignature

function getDate() {
  return new Date()
}

// === usePromise ===================================================

type PromiseRes<T> =
  | {
      result: undefined
      error: undefined
      state: 'pending'
    }
  | {
      result: T
      error: undefined
      state: 'resolved'
    }
  | {
      result: undefined
      error: Error
      state: 'rejected'
    }

const initialState: PromiseRes<any> = {
  result: undefined,
  error: undefined,
  state: 'pending'
}

export const usePromise = hook('usePromise', function <
  T
>(getPromise: () => Promise<T>, getDeps?: () => any[]) {
  const [state, setState] = useState<PromiseRes<T>>(initialState)

  let promiseIdx = -1

  useEffect(
    () => {
      ++promiseIdx

      if (state.state !== 'pending') {
        setState(initialState)
      }

      const myPromiseIdx = promiseIdx

      getPromise()
        .then((result) => {
          if (promiseIdx === myPromiseIdx) {
            setState({
              result,
              state: 'resolved'
            })
          }
        })
        .catch((error) => {
          if (promiseIdx === myPromiseIdx) {
            setState({
              error: error instanceof Error ? error : new Error(String(error)),
              state: 'rejected'
            })
          }
        })
    },
    typeof getDeps === 'function' ? getDeps : () => []
  )

  return {
    getState: () => state.state,
    getResult: () => state.result,
    getError: () => state.error
  }
})

// === locals ========================================================

function isEqualArray(arr1: any[], arr2: any[]) {
  let ret =
    Array.isArray(arr1) && Array.isArray(arr2) && arr1.length === arr2.length

  if (ret) {
    for (let i = 0; i < arr1.length; ++i) {
      if (arr1[i] !== arr2[i]) {
        ret = false
        break
      }
    }
  }

  return ret
}

// === context =======================================================

type ContextDetail<T> = {
  context: Ctx<T>
  callback: (newValue: T) => void
  cancelled: Promise<null>
}

export const useCtx = hook('useCtx', useCtxFn)

function useCtxFn<C extends CtxConfig>(config: C): ResultOfCtxConfig<C>

function useCtxFn<T>(ctx: Ctx<T>): () => T

function useCtxFn(arg: any): any {
  if (arg && arg.kind === 'context') {
    return withConsumer(arg)
  }

  const ret: any = {}

  Object.entries(arg).forEach(([k, v]) => {
    Object.defineProperty(ret, k, {
      get:
        (v as any).kind === 'context'
          ? withConsumer(v as any)
          : (arg[k] as () => any)
    })
  })

  return ret
}

function withConsumer<T>(ctx: Ctx<T>): () => T {
  const c = currentCtrl!
  const host = c.getHost()
  let cancel: null | (() => void) = null

  const cancelled = new Promise<null>((resolve) => {
    cancel = () => resolve(null)
  })

  let value = ctx.defaultValue

  c.beforeMount(() => {
    const detail: ContextDetail<T> = {
      context: ctx,

      callback: (newValue: T) => {
        value = newValue
        c.refresh()
      },

      cancelled
    }

    host.dispatchEvent(
      new CustomEvent('$$context$$', {
        detail,
        bubbles: true,
        composed: true
      })
    )
  })

  c.beforeUnmount(() => cancel!())

  return () => value! // TODO
}
