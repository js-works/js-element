export type Props = Record<string, any> // TODO
export type VElement<T extends Props = Props> = Record<any, any> // TODO
export type Ref<T> = { current: T | null }
export type Methods = Record<string, (...args: any[]) => any>
export type EventHandler<T> = (ev: T) => void
export type UIEvent<T extends string, D = null> = CustomEvent<D> & { type: T }

export type VNode =
  | null
  | boolean
  | number
  | string
  | VElement
  | Iterable<VNode>

export type Task = () => void
export type Message = { type: string } & Record<string, any>
export type State = Record<string, any>

export type Component<P> = {
  (props?: P, ...children: VNode[]): VElement<P>
  tagName: string
}

export type MethodsOf<C> = C extends Component<infer P>
  ? P extends { ref?: Ref<infer M> }
    ? M
    : never
  : never

export type Ctrl = {
  getName(): string
  getHost(): HTMLElement
  isInitialized(): boolean
  isMounted(): boolean
  hasUpdated(): boolean
  refresh(): void
  afterMount(task: Task): void
  onceBeforeUpdate(task: Task): void
  beforeUpdate(task: Task): void
  afterUpdate(task: Task): void
  beforeUnmount(task: Task): void
}

export type Store<S extends State> = {
  getState(): S
  subscribe(subscriber: () => void): () => void
  dispatch(msg: Message): void
  destroy?(): void
}
