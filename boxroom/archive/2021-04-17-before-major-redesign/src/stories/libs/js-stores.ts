import { Observable, OperatorFunction, Subject } from 'rxjs'
import { filter } from 'rxjs/operators'

export {
  combineEffects,
  createStore,
  createEffects,
  done,
  ofType,
  Message,
  State
}

type State = Record<string, any>
type Message = Record<string, any> & { type: string }

type Effects<S extends State> = (
  msg$: Observable<Message>,
  state$: Observable<S>,
  getState: () => S
) => Observable<Message>

function done<T>() {
  return filter<T>(() => false)
}

function combineEffects<S extends State>(
  ...effects: (Effects<S> | { effects: Effects<S> })[]
): Effects<S> {
  return (msg$, actions$, getState) => {
    const out$ = new Subject<Message>()

    for (const e of effects) {
      let eff = typeof e === 'function' ? e : e.effects

      eff(msg$, actions$, getState).subscribe((msg) => {
        out$.next(msg)
      })
    }

    return out$.asObservable()
  }
}

function createEffects<S extends State>(
  fn: (
    msg$: Observable<Message>,
    state$: Observable<S>,
    getState: () => S
  ) => Record<string, Observable<Message>>
): Effects<S> {
  return (msg2$, state2$, getState2) => {
    const outSubject = new Subject<Message>()

    const result = fn(msg2$, state2$, getState2)

    for (const key of Object.keys(result)) {
      result[key].subscribe((msg) => {
        outSubject.next(msg)
      })
    }

    return outSubject.asObservable()
  }
}

type MessageCreator<M extends Message> = {
  (...args: any[]): M
  type: string
}

function ofType<M extends Message>(
  creator: MessageCreator<M>
): OperatorFunction<Message, M> {
  return (input$) =>
    input$.pipe(
      filter((msg) => msg && msg.type === creator.type)
    ) as Observable<M>
}

function createStore<S extends State>(
  reducer: (state: S, msg: Message) => S,
  initialState: S,
  effects?: Effects<S>
) {
  const subscribers = new Set<() => void>()
  let state = initialState

  let msgSubject: Subject<Message>
  let stateSubject: Subject<S>

  if (effects) {
    msgSubject = new Subject()
    stateSubject = new Subject()

    effects(msgSubject.asObservable(), stateSubject.asObservable(), () =>
      store.getState()
    ).subscribe((msg) => {
      store.dispatch(msg)
    })
  }

  const store = {
    getState(): S {
      return state
    },

    dispatch(msg: Message): void {
      const newState = reducer(state, msg)

      if (newState !== state) {
        state = newState
        subscribers.forEach((it) => it())

        if (effects) {
          stateSubject.next(state)
        }
      }

      msgSubject.next(msg)
    },

    subscribe(subscriber: () => void): () => void {
      const subscriber2 = () => subscriber()
      subscribers.add(subscriber2)

      return () => subscribers.delete(subscriber2)
    }
  }

  return store
}
