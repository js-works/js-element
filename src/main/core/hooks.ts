import { Ctrl, Ref } from './types'

// === constants =====================================================

const STORE_KEY = 'js-elements::ext::store'

// === types =========================================================

type Task = () => void
type Methods = Record<string, (...args: any[]) => any>
type State = Record<string, any>

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

type Store<S extends State> = {
  getState(): State
  subscribe(listener: () => void): () => void
  dispatch(msg: Message): void
}

// === createCoreHook ================================================

function createCoreHook<A extends any[], R>(
  name: string,
  func: (ctrl: Ctrl, ...args: A) => R
): (...args: A) => R {
  function ret(...args: A) {
    const ctrl: Ctrl | undefined = (globalThis as any)['__currCompCtrl__']

    if (!ctrl) {
      throw new Error(
        `Hook function "${name}" has been called outside of component initialization phase`
      )
    }

    return func(ctrl, ...args)
  }

  Object.defineProperty(ret, 'name', {
    value: name
  })

  return ret
}

// === createHook =================================================

export function createHook<A extends any[], R>(
  name: string,
  func: (...args: A) => R
): (...args: A) => R {
  return createCoreHook(name, (ctrl: Ctrl, ...args: A) => func(...args))
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

  const useCtxProvider = createCoreHook(`${hookName}Provider`, (c: Ctrl) => {
    const root = c.getRoot()
    const subscribers: ((value: T) => void)[] = []

    const setCtxValue = (value: T) => {
      subscribers.forEach((subscriber) => subscriber(value))
    }

    root.addEventListener(subscribeEventType, (ev: any) => {
      subscribers.push(ev.detail.notify)

      ev.detail.cancelled.then(() => {
        subscribers.splice(subscribers.indexOf(ev.detail.notify), 1)
      })
    })

    return setCtxValue
  })

  const useCtx = createCoreHook(hookName, (c: Ctrl) => {
    const root = c.getRoot()
    let cancel: null | (() => void) = null

    const cancelled = new Promise<null>((resolve) => {
      cancel = () => resolve(null)
    })

    let value = defaultValue

    root.dispatchEvent(
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

    useOnUnmount(() => cancel!())

    return () => value! // TODO
  })

  return [useCtxProvider, useCtx]
}

// === useMethods ====================================================

export const useMethods = createHook(
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

export const useRefresher = createCoreHook(
  'useRefresher',
  function (c: Ctrl): Task {
    return c.refresh
  }
)

// === useStatus =====================================================

export const useStatus = createCoreHook('useStatus', function (c: Ctrl): {
  isMounted: () => boolean
  hasUpdated: () => boolean
} {
  return {
    isMounted: c.isMounted,
    hasUpdated: c.hasUpdated
  }
})

// === useValue ======================================================

export const useValue = createCoreHook('useValue', function <
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

// === useState ======================================================--

export const useState = createCoreHook('useState', function <
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

// === useEmitter ======================================================

export const useEmitter = createCoreHook('useEmitter', function (c: Ctrl): <
  E extends CustomEvent<any>
>(
  ev: E,
  handler?: (ev: E) => void
) => void {
  return (ev, handler?) => {
    c.getRoot().dispatchEvent(ev)

    if (handler) {
      handler(ev)
    }
  }
})

// === useStyles =======================================================

export const useStyles = createCoreHook(
  'useStyles',
  function (c, ...styles: string[]) {
    c.addStyles(styles)
  }
)

// === useMemo =========================================================

// TODO - this is not really optimized, is it?

export const useMemo = createCoreHook('useMemo', function <
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

export const useOnMount = createCoreHook(
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

export const useOnUpdate = createCoreHook(
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

export const useOnUnmount = createCoreHook(
  'useOnUnmount',
  function (c, action: () => void) {
    c.beforeUnmount(action)
  }
)

// === useEffect =====================================================

export const useEffect = createCoreHook(
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

export const useCtx = createCoreHook('useCtx', function <
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

export const useInterval = createCoreHook(
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

export const useTimer = createCoreHook('useTimer', function <
  T
>(c: Ctrl, delay: number | (() => number), getter: (n: number) => T = getDate as any): () => T {
  let idx = 0
  const getDelay = typeof delay === 'function' ? delay : () => delay
  const [getValue, setValue] = useValue(getter(idx++))

  useInterval(
    () => {
      setValue(getter(idx++))
    },
    () => getDelay()
  )

  return getValue
})

function getDate(idx: number) {
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

export const usePromise = createCoreHook('usePromise', function <
  T
>(c: Ctrl, getPromise: () => Promise<T>, getDeps?: () => any[]) {
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

// === useMousePosition ================================================

export const useMousePosition = createHook('useMousePosition', () => {
  const [mousePos, setMousePos] = useState({ x: -1, y: -1 })

  useOnMount(() => {
    const listener = (ev: any) => {
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

export const useActions = createCoreHook('useActions', function <
  C extends MessageCreators
>(c: Ctrl, msgCreators: C): ActionsOf<C> {
  let store: Store<any> | null = null

  const ret: any = {}

  c.send({
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

  for (const key of Object.keys(msgCreators)) {
    ret[key] = (...args: any[]) => {
      store!.dispatch(msgCreators[key](...args))
    }
  }

  return ret
})

// === createStoreHooks ==============================================

let eventKeyCounter = 0

export function createStoreHooks<S extends State>(): [
  (store: Store<S>) => void,
  <U extends Selectors<S>>(selectors: U) => SelectorsOf<S, U>
] {
  const STORE_KEY2 = STORE_KEY + ++eventKeyCounter

  const useStore = createCoreHook('useStore', (c, store: Store<S>): void => {
    c.receive(STORE_KEY, (msg: Message) => {
      msg.payload.setStore(store)
    })

    c.receive(STORE_KEY2, (msg: Message) => {
      msg.payload.setStore(store)
    })
  })

  const useSelectors = createCoreHook('useSelectors', function <
    U extends Selectors<S>
  >(c: Ctrl, selectors: U): SelectorsOf<S, U> {
    let store: Store<S> | null = null

    const ret: any = {}

    c.send({
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
