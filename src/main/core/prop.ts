// === imports =======================================================

import { Func, Prop, PropConfig } from './types'

// === exports =======================================================

export { prop }

// === propConfigBuilder =============================================

type AllowedConstructors =
  | BooleanConstructor
  | NumberConstructor
  | StringConstructor
  | ObjectConstructor
  | FunctionConstructor
  | ArrayConstructor

type withAsFunc<T extends Record<string, any>> = T & { as: () => T }

type PropConfigBuilder<Type, TypeHint> = {
  opt(): withAsFunc<{ type: TypeHint }>
  opt(defaultValue: Type): withAsFunc<{ type: TypeHint; defaultValue: Type }>
  req(): withAsFunc<{ type: TypeHint; required: true }>
}

type PropConfigBuilderWithoutTypeHint<Type> = {
  opt(): withAsFunc<{}>
  opt(defaultValue: Type): withAsFunc<{ defaultValue: Type }>
  req(): withAsFunc<{ required: true }>
}

type ReturnTypesOrNulls<T extends (Func | null)[]> = T extends (infer U)[]
  ? U extends ObjectConstructor
    ? Record<any, any>
    : U extends Func
    ? ReturnType<U>
    : null
  : never

type TupleTypeToArrayType<T> = T extends (infer U)[] ? U[] : never

const prop: {
  (): PropConfigBuilderWithoutTypeHint<any>
  <A extends AllowedConstructors>(type: A): PropConfigBuilder<ReturnType<A>, A>
  <A extends (AllowedConstructors | null)[]>(...types: A): PropConfigBuilder<
    ReturnTypesOrNulls<A>,
    TupleTypeToArrayType<A>
  >

  readonly bool: PropConfigBuilder<Boolean, BooleanConstructor>
  readonly nbool: PropConfigBuilder<Boolean | null, [BooleanConstructor, null]>
  readonly num: PropConfigBuilder<Number, NumberConstructor>
  readonly nnum: PropConfigBuilder<Number | null, [NumberConstructor, null]>
  readonly str: PropConfigBuilder<string, StringConstructor>
  readonly nstr: PropConfigBuilder<string | null, [StringConstructor, null]>
  readonly obj: PropConfigBuilder<Record<any, any>, ObjectConstructor>
  readonly nobj: PropConfigBuilder<Record<any, any>, [ObjectConstructor, null]>
  readonly func: PropConfigBuilder<Func, FunctionConstructor>
  readonly nfunc: PropConfigBuilder<Func | null, [FunctionConstructor, null]>
  readonly arr: PropConfigBuilder<any[], ArrayConstructor>
  readonly narr: PropConfigBuilder<any[] | null, [ArrayConstructor, null]>

  readonly evt: () => { type: Function }

  opt(): withAsFunc<{}>
  opt<T>(defaultValue: T): withAsFunc<{ defaultValue: T }>
  req(): withAsFunc<{ required: true }>
} = (() => {
  let prop: any = function (...args: any[]) {
    const argc = args.length

    if (argc === 0) {
      return {
        opt: (defaultValue: any) =>
          defaultValue === undefined ? {} : { defaultValue },

        req: () => ({
          required: true
        })
      }
    }

    const types = argc === 1 ? args[0] : args

    return {
      opt: (defaultValue: any) =>
        defaultValue === undefined
          ? new ExtPropConfig({ type: types })
          : new ExtPropConfig({
              type: types,
              defaultValue
            }),

      req: () =>
        new ExtPropConfig({
          type: types,
          required: true
        })
    }
  }

  prop.bool = prop(Boolean)
  prop.nbool = prop(Boolean, null)
  prop.num = prop(Number)
  prop.nnum = prop(Number, null)
  prop.str = prop(String)
  prop.nstr = prop(String, null)
  prop.obj = prop(Object)
  prop.nobj = prop(Object, null)
  prop.func = prop(Function)
  prop.nfunc = prop(Function, null)
  prop.arr = prop(Array)
  prop.narr = prop(Array, null)

  prop.evt = () => prop.func.opt().as()

  prop.opt = () => new ExtPropConfig({})
  prop.req = () => new ExtPropConfig({ required: true })

  return Object.freeze(prop)
})()

class ExtPropConfig<T> {
  constructor(data: T) {
    Object.assign(this, data)

    Object.defineProperty(this, 'as', {
      value: () => data
    })
  }

  as(): T {
    // Will be overridden in consructor
    return null as any
  }
}
