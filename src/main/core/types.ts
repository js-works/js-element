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
  Prop,
  Props,
  PropConfig,
  PropConverter,
  PropsConfig,
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

type Prop<T> =
  | (T extends boolean ? () => T : never)
  | (T extends number ? () => T : never)
  | (T extends string ? () => T : never)
  | (T extends object ? () => T : never)
  | (T extends (...args: any[]) => any ? () => T : never)
  | (T extends any[] ? () => T : never)
  | (
      | (T extends boolean ? () => T : never)
      | (T extends number ? () => T : never)
      | (T extends string ? () => T : never)
      | (T extends object ? () => T : never)
      | (T extends (...args: any[]) => any ? () => T : never)
      | (T extends any[] ? () => T : never)
      | (T extends null ? null : never)
    )[]

type PropType<P> = P extends PropTypeConfig
  ? PropTypeConfigType<P>
  : P extends ((() => infer T) | null)[]
  ? P extends (() => any)[]
    ? T
    : T | null
  : never

type PropTypeConfig =
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
      | null
    )
/* &
      Prop<any>*/ ;[]

type PropTypeConfigType<C> =
  | (C extends BooleanConstructor ? boolean : never)
  | (C extends NumberConstructor ? number : never)
  | (C extends StringConstructor ? string : never)
  | (C extends ObjectConstructor ? Record<any, any> : never)
  | (C extends FunctionConstructor ? (...args: any[]) => any : never)
  | (C extends ArrayConstructor ? any[] : never)
  | (BooleanConstructor[] extends C ? boolean : never)
  | (NumberConstructor[] extends C ? number : never)
  | (StringConstructor[] extends C ? string : never)
  | (ObjectConstructor[] extends C ? Record<any, any> : never)
  | (FunctionConstructor[] extends C ? (...args: any[]) => any : never)
  | (ArrayConstructor[] extends C ? any[] : never)
  | (null[] extends C ? null : never)

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
      | null
    )[]

type PropConfig<T> =
  | {
      type: TypeHint
      defaultValue: T
    }
  | {
      type: TypeHint
    }
  | {
      type: TypeHint
      required: true
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

// TODO!!!!!!!
type PropOf<P extends PropConfig<any>> = P extends { type: infer T }
  ? PropType<T>
  : never

/*
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
*/
type PropConverter<T> = {
  fromPropToString(value: T): string
  fromStringToProp(value: string): T
}
