const
  reqAndOpt = (type, nullable) => ({
    req: () => propConfig(type, nullable, true),
    opt: (defaultValue, isGetter) => propConfig(type, nullable, false, defaultValue, isGetter)
  }),

  typedProp = type => ({
    nul: reqAndOpt(type, true),
    ...reqAndOpt(type, false)
  }),
  
  propConfig = (type, nullable, required, defaultValue, defaultPropIsGetter) => {
    const ret = {}

    type && (ret.type = type)
    nullable && (ret.nullable = true)
    required && (ret.required = true)

    if (defaultValue !== undefined) {
      if (defaultPropIsGetter && typeof defaultProp === 'function') {
        Object.defineProp(ret, 'defaultValue', {
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
