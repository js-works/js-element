// === exports =======================================================

export { Action, AnyElement, Ctrl, Message, Methods, State, StateUpdater }

// === types =========================================================

type Action = () => void
type Message = { type: string } & Record<string, any>
type Methods = Record<string, (...args: any[]) => any>
type State = Record<string, any>
type AnyElement = Element & Record<string, any>

type StateUpdater<S extends State> = {
  (newState: Partial<S>): void
  (stateUpdate: (oldState: S) => Partial<S>): void
  (key: keyof S, newValue: S[typeof key]): void
  (key: keyof S, valueUpdate: (oldValue: S[typeof key]) => S[typeof key]): void
}

type Ctrl = {
  // library agnostic component control functions
  getName(): string
  isInitialized(): boolean
  isMounted(): boolean
  refresh(): void
  afterMount(action: Action): void
  onceBeforeUpdate(action: Action): void
  afterUpdate(action: Action): void
  beforeUnmount(action: Action): void

  // js-elements specific control functions
  getElement(): Element
  getRoot(): Element
  addState<S extends State>(initialState: S): [S, StateUpdater<S>]
  effect(action: Action, getDeps?: null | (() => any[])): void
  setMethods(methods: Methods): void // TODO!!!!!!!!!!!!!!!
  find<T = {}>(selector: string): (T & Element) | null
  findAll<T = {}>(selector: string): NodeListOf<T & Element>
  send(message: Message): void
  receive(receiver: (message: Message) => void): () => void
}
