// === exports =======================================================

export {
  Action,
  AnyElement,
  Class,
  Component,
  ComponentOptions,
  Ctrl,
  ExternalPropsOf,
  InternalPropsOf,
  Key,
  Message,
  Methods,
  Notifier,
  Props,
  PropConfig,
  PropConverter,
  PropsConfig,
  Renderer,
  State,
  StateUpdater,
  VElement,
  VNode
}

// === types =========================================================

type Key = string | number
type Props = Record<string, any> & { key?: never; children?: VNode }
type VElement<T extends Props = Props> = any // TODO !!!!!!!!

type VNode =
  | undefined
  | null
  | boolean
  | number
  | string
  | VElement
  | Iterable<VNode>

type Component<P extends Props = {}, M extends Methods = {}> = (
  props?: P & { key?: Key }
) => VNode // TODO

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
  beforeUpdate(action: Action): void
  afterUpdate(action: Action): void
  beforeUnmount(action: Action): void

  // js-elements specific control functions
  update(action: Action): void
  updateFn<A extends any[]>(fn: (...args: A) => void): (...args: A) => void
  getElement(): Element
  getContentElement(): Element
  effect(action: Action, getDeps?: null | (() => any[])): void
  setMethods(methods: Methods): void // TODO!!!!!!!!!!!!!!!
  find<T = {}>(selector: string): (T & Element) | null
  findAll<T = {}>(selector: string): NodeListOf<T & Element>
  send(message: Message): void
  receive(receiver: (message: Message) => void): () => void
}

// === types =========================================================

type Class<T> = {
  new (...arg: any[]): T
}

type Renderer = (content: any, target: Element) => void

type Notifier = {
  subscribe(subscriber: () => void): void
  notify(): void
}

type ComponentOptions = {
  props?: PropsConfig
  slots?: string[]
  styles?: string | string[]
  methods?: string[] // TODO
}

type PropConfig<T> = {
  type?: T extends boolean
    ? BooleanConstructor
    : T extends number
    ? NumberConstructor
    : T extends string
    ? StringConstructor
    : T extends object
    ? ObjectConstructor
    : T extends Function
    ? FunctionConstructor
    : T extends undefined
    ? any
    : T extends unknown
    ? any
    : never

  nullable?: boolean
  required?: boolean
  defaultValue?: T
}

type PropsConfig = {
  [key: string]: PropConfig<any>
}

type ExternalPropsOf<P extends PropsConfig> = Pick<
  { [K in keyof P]?: PropOf<P[K]> },
  { [K in keyof P]: P[K] extends { required: true } ? never : K }[keyof P]
> &
  Pick<
    { [K in keyof P]: PropOf<P[K]> },
    { [K in keyof P]: P[K] extends { required: true } ? K : never }[keyof P]
  >

type InternalPropsOf<PC extends PropsConfig> = Pick<
  { [K in keyof PC]: PropOf<PC[K]> },
  {
    [K in keyof PC]: PC[K] extends { defaultValue: any }
      ? K
      : PC[K] extends { required: true }
      ? K
      : never
  }[keyof PC]
> &
  Pick<
    { [K in keyof PC]?: PropOf<PC[K]> },
    {
      [K in keyof PC]: PC[K] extends { defaultValue: any }
        ? never
        : PC[K] extends { required: true }
        ? never
        : K
    }[keyof PC]
  >

type PropOf<P extends PropConfig<any>> = P extends { type: infer T }
  ?
      | (T extends Boolean
          ? boolean
          : T extends Number
          ? number
          : T extends String
          ? string
          : T extends ArrayConstructor
          ? any[]
          : T extends Date
          ? Date
          : T extends undefined
          ? any
          : any) // TODO!!!!!!!!!!! Must be <never>!!!!
      | (P extends { nullable: true } ? null : never)
  : never

type PropConverter<T> = {
  fromPropToString(value: T): string
  fromStringToProp(value: string): T
}
