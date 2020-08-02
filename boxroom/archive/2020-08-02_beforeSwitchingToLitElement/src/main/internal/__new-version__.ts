// === types =========================================================

type Props = Record<string, any>
type State = Record<string, any>

type Methods = {
  [name: string]: (...args: any[]) => any
}

type VElement<T = any> = any // TODO
type VNode = VElement | string | number | Iterable<VNode>
type Component<P extends Props> = (props: P) => VNode

type Ctrl<P extends Props = {}> = {
  getName(): string
  getProps(): P
  getRoot(): Element // TODO!!!
  isInitialized(): boolean
  isMounted(): boolean
  refresh(): void
  afterMount(action: () => void): void
  beforeUpdate(action: () => void): void
  afterUpdate(action: () => void): void
  beforeUnmount(action: () => void): void
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
    : never

  nullable?: boolean
  required?: boolean
  default?: T
}

type PropsConfig = {
  [key: string]: PropConfig<any>
}

type CtxConfig = (c: Ctrl) => Record<string, () => any>

type Config1<P extends PropsConfig, C extends CtxConfig> = {
  props?: P
  ctx?: C
  styles?: string | (() => string)
  slots?: string[]
  init: P extends PropsConfig
    ? C extends unknown
      ? (
          self: Ctrl<InternalPropsOf<P>>,
          props: InternalPropsOf<P>,
          update: (action?: () => void) => void
        ) => () => VNode
      : (
          self: Ctrl<InternalPropsOf<P>>,
          props: InternalPropsOf<P>,
          ctx: CtxOf<C>,
          update: (action?: () => void) => void
        ) => () => VNode
    : C extends unknown
    ? (
        self: Ctrl<InternalPropsOf<P>>,
        update: (action?: () => void) => void
      ) => () => VNode
    : (
        self: Ctrl<InternalPropsOf<P>>,
        ctx: CtxOf<C>,
        update: (action?: () => void) => void
      ) => () => VNode
}

type Config2<P extends PropsConfig, C extends CtxConfig> = {
  props?: P
  ctx?: C
  styles?: string | (() => string)
  slots?: string[]
  render: P extends PropsConfig
    ? C extends unknown
      ? (props: InternalPropsOf<P>) => VNode
      : (props: InternalPropsOf<P>, ctx: CtxTypeOf<C>) => VNode
    : C extends unknown
    ? () => VNode
    : (ctx: CtxTypeOf<C>) => VNode
}

type ExternalPropsOf<P extends PropsConfig> = Pick<
  { [K in keyof P]?: PropOf<P[K]> },
  { [K in keyof P]: P[K] extends { required: true } ? never : K }[keyof P]
> &
  Pick<
    { [K in keyof P]: PropOf<P[K]> },
    { [K in keyof P]: P[K] extends { required: true } ? K : never }[keyof P]
  >

type InternalPropsOf<P extends PropsConfig> = Pick<
  { [K in keyof P]: PropOf<P[K]> },
  {
    [K in keyof P]: P[K] extends { default: any }
      ? K
      : P[K] extends { required: true }
      ? K
      : never
  }[keyof P]
> &
  Pick<
    { [K in keyof P]?: PropOf<P[K]> },
    {
      [K in keyof P]: P[K] extends { default: any }
        ? never
        : P[K] extends { required: true }
        ? never
        : K
    }[keyof P]
  >

type PropOf<P extends PropConfig<any>> = P extends { type: infer T }
  ?
      | (T extends BooleanConstructor
          ? boolean
          : T extends NumberConstructor
          ? number
          : T extends StringConstructor
          ? string
          : T extends ArrayConstructor
          ? any[]
          : T extends DateConstructor
          ? Date
          : any)
      | (P extends { nullable: true } ? null : never)
  : never

type CtxOf<C extends CtxConfig> = {
  [K in keyof ReturnType<C>]: ReturnType<ReturnType<C>[K]>
}

type CtxTypeOf<C extends CtxConfig> = C extends (
  c: Ctrl
) => Record<infer K, () => infer R>
  ? Record<K, R>
  : C extends Record<infer K, () => infer R>
  ? Record<K, R>
  : never

function defineElement<P extends PropsConfig, C extends CtxConfig>(
  name: string,
  config: Config1<P, C>
): Component<ExternalPropsOf<P>>

function defineElement<P extends PropsConfig, C extends CtxConfig>(
  name: string,
  config: Config2<P, C>
): Component<ExternalPropsOf<P>>

function defineElement(name: string, config: any): any {
  return null
}

const Test = defineElement('some-test', {
  props: {
    a: {
      type: Boolean,
      nullable: true,
      required: true
    },

    b: {
      type: String,
      nullable: true
      //      default: 'xxxx'
    }
  },

  init(self, props, update) {
    props
    return () => 'xxx'
  }
})

Test({ a: true })
