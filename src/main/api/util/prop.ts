const
  reqAndOpt = (type: any, nullable: any) => ({ // TODO
    req: () => propConfig(type, nullable, true),
    opt: (defaultValue?: any, isGetter: boolean = false) => propConfig(type, nullable, false, defaultValue, isGetter) // TODO
  }),

  typedProp = (type: any) => ({ // TODO
    nul: reqAndOpt(type, true),
    ...reqAndOpt(type, false)
  }),
  
  propConfig = (type: any, nullable: any, required: any, defaultValue: any = undefined, defaultValueIsGetter: any = false) => { // TODO
    const ret: any = {} // TODO

    type && (ret.type = type)
    nullable && (ret.nullable = true)
    required && (ret.required = true)

    if (defaultValue !== undefined) {
      if (defaultValueIsGetter && typeof defaultValue === 'function') {
        Object.defineProperty(ret, 'defaultValue', {
          get: defaultValue
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
  arr: typedProp(Array),
  date: typedProp(Date),
  ...reqAndOpt(null, false)
})
