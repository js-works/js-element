// === exports =======================================================

export {
  Action,
  AnyElement,
  Class,
  Component,
  ComponentOptions,
  Ctrl,
  ExternalPropsOf,
  Func,
  InternalPropsOf,
  Key,
  Message,
  Methods,
  Notifier,
  Props,
  PropConverter,
  PropConfig,
  PropsConfig,
  PropsOf,
  PropType,
  Renderer,
  State,
  VElement,
  VNode
}

// === types =========================================================

type Func = (...args: any[]) => any
type Key = string | number
type Props = Record<string, any> & { key?: never; children?: VNode }
type VElement<T extends Props = Props> = Record<any, any>

type VNode = null | boolean | number | string | VElement | Iterable<VNode>

type Component<P extends Props = {}, M extends Methods = {}> = (
  props?: P & { key?: Key }
) => VElement<P>

type PropsOf<C extends Component<any, any>> = C extends Component<infer P>
  ? P
  : never

type Action = () => void
type Message = { type: string } & Record<string, any>
type Methods = Record<string, (...args: any[]) => any>
type State = Record<string, any>
type AnyElement = Element & Record<string, any>

type StateUpdater<T extends Record<string, any>> = {
  (newState: Partial<T>): void
  (stateUpdate: (oldState: T) => Partial<T>): void
  (key: keyof T, newValue: T[typeof key]): void
  (key: keyof T, valueUpdate: (oldValue: T[typeof key]) => T[typeof key]): void
}

type OmitNevers<T extends Record<any, any>> = Pick<
  T,
  {
    [K in keyof T]: T[K] extends never ? never : K
  }[keyof T]
>

type Ctrl = {
  // library agnostic component control functions
  getName(): string
  isInitialized(): boolean
  isMounted(): boolean
  hasUpdated(): boolean
  refresh(): void
  afterMount(action: Action): void
  onceBeforeUpdate(action: Action): void
  beforeUpdate(action: Action): void
  afterUpdate(action: Action): void
  beforeUnmount(action: Action): void
  addStyles(styles: string | string[]): void
  send(message: Message): void
  receive(type: string, handler: (message: Message) => void): () => void

  // js-elements specific control functions

  update(action: Action): void
  updateFn<A extends any[]>(fn: (...args: A) => void): (...args: A) => void
  effect(action: Action, getDeps?: null | (() => any[])): void
  setMethods(methods: Methods): void // TODO!!!!!!!!!!!!!!!
  find<T = {}>(selector: string): (T & Element) | null
  findAll<T = {}>(selector: string): NodeListOf<T & Element>
}

type Class<T> = {
  new (...arg: any[]): T
}

type Renderer = (content: any, target: Element) => void

type Notifier = {
  subscribe(subscriber: () => void): void
  notify(): void
}

declare const tag: unique symbol

type PropType<Type, Kind extends 'optional' | 'defaulted' | 'required'> = {
  readonly [tag]: 'PropType'
}

type ComponentOptions = {
  props?: PropsConfig
  slots?: string[]
  styles?: string | string[] | (() => string | string[])
  methods?: string[] // TODO
}

type TypeHint =
  | BooleanConstructor
  | NumberConstructor
  | StringConstructor
  | ObjectConstructor
  | FunctionConstructor
  | ArrayConstructor
  | (
      | BooleanConstructor
      | NumberConstructor
      | StringConstructor
      | ObjectConstructor
      | FunctionConstructor
      | ArrayConstructor
    )[]

type PropConfig =
  | {
      type?: TypeHint
      defaultValue?: any
    }
  | {
      type?: TypeHint
      required: true
    }

type PropsConfig = {
  [key: string]: PropType<any, any>
}

type ExternalPropsOf<PC extends PropsConfig> = Partial<
  OmitNevers<
    {
      [K in keyof PC]: PC[K] extends PropType<infer T, infer K>
        ? K extends 'required'
          ? never
          : T
        : never
    }
  >
> &
  OmitNevers<
    {
      [K in keyof PC]: PC[K] extends PropType<infer T, infer K>
        ? K extends 'required'
          ? T
          : never
        : never
    }
  >

type InternalPropsOf<PC extends PropsConfig> = Partial<
  OmitNevers<
    {
      [K in keyof PC]: PC[K] extends PropType<infer T, infer K>
        ? K extends 'required'
          ? never
          : K extends 'defaulted'
          ? never
          : T
        : never
    }
  >
> &
  OmitNevers<
    {
      [K in keyof PC]: PC[K] extends PropType<infer T, infer K>
        ? K extends 'required'
          ? T
          : K extends 'defaulted'
          ? T
          : never
        : never
    }
  >

type PropConverter<T> = {
  fromPropToString(value: T): string
  fromStringToProp(value: string): T
}
