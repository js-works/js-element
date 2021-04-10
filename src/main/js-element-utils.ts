import {
  hook,
  useAfterMount,
  useBeforeMount,
  useHost,
  useRefresher,
  useReactive
} from 'js-element/hooks'
export { initStore, createMobxHooks }

// === types =========================================================

type Message = Record<string, any> & { type: string }

// === store =========================================================

type State = Record<string, any>

type Store<S extends State> = {
  getState(): S
  subscribe(subscriber: () => void): () => void
  dispatch(msg: any): void // TODO
  destroy?(): void
}

type InitStoreResult<S extends State> = [
  Store<S>,
  (fn: (state: S) => S) => void,
  () => S
]

function initStore<S extends State>(initialState: S): InitStoreResult<S>

function initStore<S extends State>(
  name: string,
  initialState: S
): InitStoreResult<S>

function initStore<S extends State>(arg1: any, arg2?: any): InitStoreResult<S> {
  let state: S = typeof arg1 === 'string' ? arg2 : arg1
  let subscribers: ((() => void) | null)[] = []
  let notifying = false
  let unsubscribedWhileNotifying = false
  let destroyed = false

  const name = typeof arg1 === 'string' ? arg1 : '' // TODO
  const getState = () => state

  const setState = (fn: (state: S) => S) => {
    state = Object.assign({}, state, fn(state)) // TODO

    if (notifying) {
      throw new Error('Not allowed to set state while store is notifying')
    }

    const subscriberCount = subscribers.length
    unsubscribedWhileNotifying = false

    try {
      for (let i = 0; i < subscriberCount; ++i) {
        const subscriber = subscribers[i]

        if (subscriber) {
          subscriber()
        }
      }

      if (unsubscribedWhileNotifying) {
        subscribers = subscribers.filter((it) => it !== null)
      }
    } finally {
      unsubscribedWhileNotifying = false
      notifying = false
    }
  }

  const store: Store<S> = {
    getState,

    dispatch(ev: any) {},

    subscribe(subscriber) {
      const sub = subscriber.bind(null)
      let unsubscribed = false

      subscribers.push(sub)

      return () => {
        if (unsubscribed) {
          return
        }

        const idx = subscribers.findIndex((it) => it === sub)

        if (notifying) {
          unsubscribedWhileNotifying = true
          subscribers[idx] = null
        } else {
          subscribers.splice(idx, 1)
        }

        unsubscribed = true
      }
    },

    destroy() {
      if (!destroyed && typeof state.destroy === 'function') {
        state.destroy()
        destroyed = true
      }
    }
  }

  return [store, setState, getState]
}

// === createMobxHooks ===============================================

let nextStoreId = 1

function createMobxHooks<S extends State>(): [(s: S) => S, () => S] {
  type ObservableEvent = CustomEvent<{
    callback: (state: S) => void
  }>

  const eventName = 'js-element/utils::mobx::' + nextStoreId++

  const useObservableProvider = hook('useObservableProvider', (s: S) => {
    const state = useReactive(s)
    const host = useHost()

    useBeforeMount(() => {
      const listener = (ev: ObservableEvent) => {
        ev.stopPropagation()
        ev.detail.callback(state)
      }

      host.addEventListener(eventName as any, listener)

      return () => {
        removeEventListener(eventName as any, listener)
      }
    })

    return state
  })

  const useObservable = () => {
    let state: S | null = null

    const host = useHost()

    useBeforeMount(() => {
      host.dispatchEvent(
        new CustomEvent(eventName, {
          detail: {
            callback: (s: S) => {
              state = s
            }
          },

          bubbles: true,
          composed: true
        })
      )
    })

    return (new Proxy(
      {},
      {
        get(target, key) {
          if (!state) {
            throw new Error('No mobx observable provided')
          }

          return state[key as any]
        },

        set(target: object, key: string | symbol, value: any) {
          if (!state) {
            throw new Error('Observable not available')
          }

          ;(state as any)[key] = value
          return true
        }
      }
    ) as any) as S
  }

  return [useObservableProvider, useObservable]
}
