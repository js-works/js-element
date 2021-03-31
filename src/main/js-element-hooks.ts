import { hook, Ctrl, Ref } from 'js-element/core'

// === constants =====================================================

const STORE_KEY = 'js-element::ext::store'

// === types =========================================================

type State = Record<string, any>
type Task = () => void
type Methods = Record<string, (...args: any[]) => any>

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

function coreHook<A extends any[], R>(
  name: string,
  fn: (ctrl: Ctrl, ...args: A) => R
): (...args: A) => R {
  return hook({ name, fn: (ctrl: Ctrl) => (...args: A) => fn(ctrl, ...args) })
}

// === createContextHooks ============================================

type ContextSubscriber<T> = {
  notifyChange(newValue: any): void
  cancelled: Promise<null>
}

let eventTypeCounter = 0

function getNewEventType(): string {
  return `$$provision$$_${++eventTypeCounter}`
}

export function createCtxHooks<T>(
  contextName: string,
  defaultValue?: T
): [() => (value: T) => void, () => () => T] {
  const hookName = 'use' + contextName[0].toUpperCase() + contextName.substr(1)
  const subscribeEventType = getNewEventType()

  const useCtxProvider = coreHook(`${hookName}Provider`, (c: Ctrl) => {
    const host = c.getHost()
    const subscribers: ((value: T) => void)[] = []

    const setCtxValue = (value: T) => {
      subscribers.forEach((subscriber) => subscriber(value))
    }

    const eventListener = (ev: any) => {
      subscribers.push(ev.detail.notify)

      ev.detail.cancelled.then(() => {
        subscribers.splice(subscribers.indexOf(ev.detail.notify), 1)
      })
    }

    c.beforeMount(() => {
      host.addEventListener(subscribeEventType, eventListener)
    })

    c.beforeUnmount(() => {
      host.removeEventListener(subscribeEventType, eventListener)
      subscribers.length = 0
    })

    return setCtxValue
  })

  const useCtx = coreHook(hookName, (c: Ctrl) => {
    const host = c.getHost()
    let cancel: null | (() => void) = null

    const cancelled = new Promise<null>((resolve) => {
      cancel = () => resolve(null)
    })

    let value = defaultValue

    c.beforeMount(() => {
      host.dispatchEvent(
        new CustomEvent(subscribeEventType, {
          detail: {
            notify: (newValue: T) => {
              value = newValue
              c.refresh()
            },

            cancelled
          },

          bubbles: true,
          composed: true
        })
      )
    })

    c.beforeUnmount(() => cancel!())

    return () => value! // TODO
  })

  return [useCtxProvider, useCtx]
}

// === useHost =======================================================

export const useHost = coreHook('useHost', (c) => {
  return c.getHost()
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

export const useRefresher = coreHook('useRefresher', function (c: Ctrl): Task {
  return c.refresh
})

// === useStatus =====================================================

export const useStatus = coreHook('useStatus', function (c: Ctrl): {
  isMounted: () => boolean
  hasUpdated: () => boolean
} {
  return {
    isMounted: c.isMounted,
    hasUpdated: c.hasUpdated
  }
})

// === useValue ======================================================

export const useValue = coreHook('useValue', function <
  T
>(c: Ctrl, initialValue: T): [
  () => T,
  (updater: T | ((value: T) => T)) => void
] {
  let nextValue = initialValue

  let value = initialValue
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

export const useData = coreHook('useData', function <
  T extends Record<string, any>
>(c: Ctrl, initialState: T): [T, StateUpdater<T>] {
  let nextState: any, // TODO
    mergeNecessary = false

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

export const useState = coreHook('useState', function <
  S extends State
>(c: Ctrl, state: S): S {
  const ret: any = {}

  Object.keys(state || {}).forEach((key) => {
    Object.defineProperty(ret, key, {
      get: () => state[key],
      set: (value: any) => void (((state as any)[key] = value), c.refresh())
    })
  })

  return ret
})

// === useEmitter ======================================================

export const useEmitter = coreHook('useEmitter', function (c: Ctrl): <
  E extends CustomEvent<any>
>(
  ev: E,
  handler?: (ev: E) => void
) => void {
  return (ev, handler?) => {
    c.getHost().dispatchEvent(ev)

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

export const useStyles = coreHook('useStyles', (c, ...styles: string[]) => {
  const ret = (...styles: string[]) => {
    addStyles(c.getHost().shadowRoot!.firstChild as Element, styles)
  }

  ret.apply(null, styles)

  return ret
})

// === useMemo =========================================================

// TODO - this is not really optimized, is it?

export const useMemo = coreHook('useMemo', function <
  T,
  A extends any[],
  G extends () => A
>(c: Ctrl, getValue: (...args: ReturnType<G>) => T, getDeps: G) {
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

export const useOnMount = coreHook(
  'useOnMount',
  function (c, action: () => void | undefined | null | (() => void)) {
    let cleanup: Task | null | undefined | void

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

export const useOnUpdate = coreHook(
  'useOnUpdate',
  function (c, action: () => void | undefined | null | (() => void)) {
    let cleanup: Task | null | undefined | void

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

export const useOnUnmount = coreHook(
  'useOnUnmount',
  function (c, action: () => void) {
    c.beforeUnmount(action)
  }
)

// === useEffect =====================================================

export const useEffect = coreHook(
  'useEffect',
  function (
    c,
    action: () => void | undefined | null | (() => void),
    getDeps?: () => any[]
  ): void {
    let oldDeps: any[] | null = null
    let cleanup: Task | null | undefined | void

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

// === useCtx ========================================================

type CtxConfig<C extends Ctrl> = Record<string, (c: C) => any> // TODO

type CtxOf<CC extends CtxConfig<any>> = {
  [K in keyof CC]: ReturnType<CC[K]>
}

export const useCtx = coreHook('useCtx', function <
  CC extends CtxConfig<any>
>(c: Ctrl, config: CC): CtxOf<CC> {
  const ctx: any = {}
  const ctxKeys = Object.keys(config)

  const updateCtx = () => {
    for (let key of ctxKeys!) {
      ctx[key] = config[key](c)
    }
  }

  updateCtx()
  c.beforeUpdate(updateCtx)
  return ctx
})

// === useInterval ======================================================

export const useInterval = coreHook(
  'useInterval',
  (c, task: Task, delay: number | (() => number)) => {
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

export const usePromise = coreHook('usePromise', function <
  T
>(c: Ctrl, getPromise: () => Promise<T>, getDeps?: () => any[]) {
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
      console.log(ev.pageX)
      // TODO
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

export const useActions = coreHook('useActions', function <
  C extends MessageCreators
>(c: Ctrl, msgCreators: C): ActionsOf<C> {
  let store: Store<any> | null = null

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

  const useStore = coreHook('useStore', (c, store: Store<S>): void => {
    c.beforeMount(() => {
      receive(c, STORE_KEY, (msg: Message) => {
        msg.payload.setStore(store)
      })

      receive(c, STORE_KEY2, (msg: Message) => {
        msg.payload.setStore(store)
      })
    })
  })

  const useSelectors = coreHook('useSelectors', function <
    U extends Selectors<S>
  >(c: Ctrl, selectors: U): SelectorsOf<S, U> {
    let store: Store<S> | null = null

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
