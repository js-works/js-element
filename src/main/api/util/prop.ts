import Class from '../../internal/#types/Class'
//import PropConfig from '../../internal/#types/PropConfig'

type PropConfig<T> = {
  type?: any, // TODO
  nullable?: null extends T ? true : never,
  required?: undefined extends T ? never : true,
  defaultValue?: undefined extends T ? T : never
}

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
    nullable && ((ret as any).nullable = true) // TODO
    required && ((ret as any).required = true) // TODO

    if (defaultValue !== undefined) {
      if (defaultValueIsGetter && typeof defaultValue === 'function') {
        Object.defineProperty(ret, 'defaultValue', {
          get: defaultValue as any // TODO
        })
      } else {
        (ret as any).defaultValue = defaultValue // TODO
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
  arr: typedProp(Array),
  date: typedProp(Date),
  ...reqAndOpt(null, false)
})
