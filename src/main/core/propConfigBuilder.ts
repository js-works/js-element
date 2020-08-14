// === imports =======================================================

import { Class, PropConfig } from './types'

// === exports =======================================================

export { propConfigBuilder }

// === propConfigBuilder =============================================

type F<C, T> = Readonly<{
  nul: Readonly<{
    req(): { type: C; nullable: true; required: true }

    opt: {
      (): { type: C; nullable: true }
      (defaultValue: T): { type: C; nullable: true; defaultValue: T }
    }
  }>

  req(): { type: C; required: true }

  opt: {
    (): { type: T }
    (defaultValue: T): { type: C; defaultValue: T }
  }
}>

type G = Readonly<{
  bool: F<Boolean, boolean>
  num: F<Number, number>
  str: F<String, string>
  obj: F<Object, object>
  func: F<Function, (...args: any[]) => any>

  req(): { required: true }

  opt: {
    (): {}
    (defaultValue: any): { defaultValue: any }
  }
}>

const reqAndOpt = <T>(
  type: PropConfig<any>['type'] | null,
  nullable: boolean
) => ({
  req: () => propConfig(type, nullable, true, undefined, false),

  opt: (defaultValue?: T, isGetter: boolean = false) =>
    propConfig(type, nullable, false, defaultValue, isGetter)
})

const typedProp = <T extends Class<any>>(type: T) => ({
  nul: reqAndOpt(type, true),
  ...reqAndOpt(type, false)
})

const propConfig = <T>(
  type: PropConfig<any>['type'],

  //  | BooleanConstructor
  //  | NumberConstructor
  //  | StringConstructor
  //  | ObjectConstructor
  //  | FunctionConstructor,
  // | ArrayConstructor
  // | DateConstructor,
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

const propConfigBuilder = (Object.freeze({
  bool: typedProp(Boolean),
  num: typedProp(Number),
  str: typedProp(String),
  obj: typedProp(Object),
  func: typedProp(Function),
  arr: typedProp(Array),
  ...reqAndOpt(null, false)
}) as any) as G
