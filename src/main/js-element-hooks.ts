import { intercept, Context, Ctrl, Ref } from 'js-element/core'

// === constants =====================================================

const STORE_KEY = 'js-element::ext::store'

// === data ==========================================================

let interceptored = false
let currentCtrl: Ctrl | null = null

// === types =========================================================

type State = Record<string, any>
type Task = () => void
type Methods = Record<string, (...args: any[]) => any>

type ContextDetail<T> = {
  context: Context<T>
  callback: (newValue: T) => void
  cancelled: Promise<null>
}

type Store<S extends State> = {
  getState(): S
  subscribe(subscriber: () => void): () => void
  dispatch(msg: any): void // TODO
  destroy?(): void
}

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

type Selectors<S extends State> = {
  [key: string]: (state: S) => any
}

type SelectorsOf<S extends State, U extends Selectors<S>> = {
  [K in keyof U]: U[K] extends (state: S) => infer R ? R : never
}

// === coreHook ================================================

function hook<A extends any[], R, F extends { (...args: A): R }>(
  name: string,
  fn: F
): F {
  if (!interceptored) {
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

    interceptored = true
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

// === useCtx ========================================================

function withConsumer<T>(ctx: Context<T>): () => T {
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

type CtxConfig = Record<string, Context<any> | (() => any)>

type ResultOfCtxConfig<C extends CtxConfig> = {
  [K in keyof C]: C[K] extends Context<infer R>
    ? R
    : C[K] extends () => infer R
    ? R
    : never
}

export const useCtx = hook('useCtx', useCtxFn)

function useCtxFn<C extends CtxConfig>(config: C): ResultOfCtxConfig<C>

function useCtxFn<T>(ctx: Context<T>): () => T

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

// === useHost =======================================================

export const useHost = hook('useHost', () => {
  return currentCtrl!.getHost()
})

// === useMethods ====================================================

export const useMethods = hook(
  'useMethods',
  <M extends Methods, R extends Ref<M>>(
    ref: R | undefined,
    methods: M | null
  ) => {
    if (ref && methods) {
      ref.current = methods
    }
  }
)

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

// === useData =======================================================

export const useData = hook('useData', function <
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

// === useState ======================================================

export const useState = hook('useState', function <
  S extends State
>(state: S): S {
  const ret: any = {}
  const c = currentCtrl!

  Object.keys(state || {}).forEach((key) => {
    Object.defineProperty(ret, key, {
      get: () => state[key],
      set: (value: any) => void (((state as any)[key] = value), c.refresh())
    })
  })

  return ret
})

// === useEmitter ======================================================

export const useEmitter = hook('useEmitter', function (): <
  E extends CustomEvent<any>
>(
  ev: E,
  handler?: (ev: E) => void
) => void {
  const host = currentCtrl!.getHost()

  return (ev, handler?) => {
    host.dispatchEvent(ev)

    if (handler) {
      handler(ev)
    }
  }
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
  const ret = (...styles: string[]) => {
    addStyles(currentCtrl!.getHost().shadowRoot!.firstChild as Element, styles)
  }

  ret.apply(null, styles)

  return ret
})

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

// === useOnMount ====================================================

export const useOnMount = hook(
  'useOnMount',
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

// === useOnUpdate ===================================================

export const useOnUpdate = hook(
  'useOnUpdate',
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

// === useOnUnmount ==================================================

export const useOnUnmount = hook('useOnUnmount', function (action: () => void) {
  currentCtrl!.beforeUnmount(action)
})

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
  const [state, setState] = useData<PromiseRes<T>>(initialState)

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

// === useMousePosition ================================================

export const useMousePosition = hook('useMousePosition', () => {
  const [mousePos, setMousePos] = useData({ x: -1, y: -1 })

  useOnMount(() => {
    const listener = (ev: any) => {
      setMousePos({ x: ev.pageX, y: ev.pageY })
    }

    window.addEventListener('mousemove', listener)

    return () => {
      window.removeEventListener('mousemove', listener)
    }
  })

  return {
    isValid: () => mousePos.x >= 0,
    getX: () => mousePos.x,
    getY: () => mousePos.y
  }
})

// === useActions ======================================================

type ActionsOf<C extends MessageCreators> = {
  [K in keyof C]: C[K] extends (...args: infer A) => any
    ? (...args: A) => void
    : never
}

export const useActions = hook('useActions', function <
  C extends MessageCreators
>(msgCreators: C): ActionsOf<C> {
  let store: Store<any> | null = null
  const c = currentCtrl!

  const ret: any = {}

  c.beforeMount(() => {
    send(c, {
      type: STORE_KEY,

      payload: {
        setStore(st: Store<any>) {
          store = st
        }
      }
    })

    if (!store) {
      throw new Error(`Store for actions not available (-> ${c.getName()})`)
    }
  })

  for (const key of Object.keys(msgCreators)) {
    ret[key] = (...args: any[]) => {
      store!.dispatch(msgCreators[key](...args))
    }
  }

  return ret
})

// === createStoreHook ===============================================

export function createStoreHook<S extends State>(store: Store<S>): () => S {
  return () => {
    const ret: any = {} // will be filled below
    const refresh = useRefresher()

    for (const key of Object.keys(store.getState())) {
      Object.defineProperty(ret, key, {
        get: () => store.getState()[key]
      })
    }

    useOnMount(() => {
      const unsubscribe = store.subscribe(() => {
        console.log('refresh')
        refresh()
      })

      return unsubscribe
    })

    return ret
  }
}

// === createStoreHooks ==============================================

let eventKeyCounter = 0

export function createStoreHooks<S extends State>(): [
  (store: Store<S>) => void,
  <U extends Selectors<S>>(selectors: U) => SelectorsOf<S, U>
] {
  const STORE_KEY2 = STORE_KEY + ++eventKeyCounter

  const useStore = hook('useStore', (store: Store<S>): void => {
    const c = currentCtrl!

    c.beforeMount(() => {
      receive(c, STORE_KEY, (msg: Message) => {
        msg.payload.setStore(store)
      })

      receive(c, STORE_KEY2, (msg: Message) => {
        msg.payload.setStore(store)
      })
    })
  })

  const useSelectors = hook('useSelectors', function <
    U extends Selectors<S>
  >(selectors: U): SelectorsOf<S, U> {
    let store: Store<S> | null = null
    const c = currentCtrl!

    const ret: any = {}

    c.beforeMount(() => {
      send(c, {
        type: STORE_KEY2,

        payload: {
          setStore(st: Store<any>) {
            store = st
          }
        }
      })

      if (!store) {
        throw new Error(`Store for selectors not available (-> ${c.getName()})`)
      }

      const unsubscribe = store!.subscribe(() => {
        c.refresh()
      })

      c.beforeUnmount(unsubscribe)
    })

    for (const key of Object.keys(selectors)) {
      Object.defineProperty(ret, key, {
        get: () => {
          return selectors[key]((store as any).getState()) // TODO!!!
        }
      })
    }

    return ret
  })

  return [useStore, useSelectors]
}

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

// === helpers =======================================================

const SEND_RECEIVE_MESSAGE_TYPE_SUFFIX = '$$js-element$$::'

function send(c: Ctrl, msg: Message): void {
  c.getHost().dispatchEvent(
    new CustomEvent(SEND_RECEIVE_MESSAGE_TYPE_SUFFIX + msg.type, {
      bubbles: true,
      composed: true,
      detail: msg
    })
  )
}

function receive(
  c: Ctrl,
  type: string,
  handler: (message: Message) => void
): () => void {
  const host = c.getHost()

  const listener = (ev: Event) => {
    ev.stopPropagation()
    handler((ev as any).detail)
  }

  const unsubscribe = () => {
    host.removeEventListener(SEND_RECEIVE_MESSAGE_TYPE_SUFFIX + type, listener)
  }

  host.addEventListener(SEND_RECEIVE_MESSAGE_TYPE_SUFFIX + type, listener)
  c.beforeUnmount(unsubscribe)

  return unsubscribe
}
