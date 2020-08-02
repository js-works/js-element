import Class from '../../internal/#types/Class'
import PropConfig from '../../internal/#types/PropConfig'

type F<C, T> = Readonly<{
  nul: Readonly<{
    req(): { type: C, nullable: true, required: true }

    opt: {
      (): { type: C, nullable: true },
      (defaultValue: T): { type: C, nullable: true, defaultValue: T }
    }
  }>,

  req(): { type: C, required: true }

  opt: {
    (): { type: T },
    (defaultValue: T): { type: C, defaultValue: T }
  }
}>

type G = Readonly<{
  bool: F<Boolean, boolean>,
  num: F<Number, number>,
  str: F<String, string>,
  obj: F<Object, object>,
  func: F<Function, (...args: any[]) => any>,
  
  req(): {  required: true }

  opt: {
    (): {},
    (defaultValue: any): { defaultValue: any }
  }
}>

const
  reqAndOpt = <T>(type: Class<T> | null, nullable: boolean) => ({
    req: () => propConfig(type, nullable, true, undefined, false),

    opt: (defaultValue?: T, isGetter: boolean = false) =>
      propConfig(type, nullable, false, defaultValue, isGetter)
  }),

  typedProp = <T extends Class<any>>(type: T) => ({
    nul: reqAndOpt(type, true),
    ...reqAndOpt(type, false)
  }),
  
  propConfig = <T>(
    type: Class<T> | null,
    nullable: boolean,
    required: boolean,
    defaultValue: T | undefined,
    defaultValueIsGetter: boolean
  ): PropConfig<T> => {
    const ret: PropConfig<T> = {}

    type && (ret.type = type)
    nullable && (ret.nullable = true)
    required && (ret.required = true)

    if (defaultValue !== undefined) {
      if (defaultValueIsGetter && typeof defaultValue === 'function') {
        Object.defineProperty(ret, 'defaultValue', {
          get: defaultValue as any // TODO
        })
      } else {
        ret.defaultValue = defaultValue
      }
    }

    return Object.freeze(ret)
  }

export default Object.freeze({
  bool: typedProp(Boolean),
  num: typedProp(Number),
  str: typedProp(String),
  obj: typedProp(Object),
  func: typedProp(Function),
  ...reqAndOpt(null, false)
}) as any as G

