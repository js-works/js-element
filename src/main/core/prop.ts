// === imports =======================================================

import { PropType } from './types'

// === exports =======================================================

export { prop }

type Type =
  | BooleanConstructor
  | NumberConstructor
  | StringConstructor
  | ObjectConstructor
  | FunctionConstructor
  | ArrayConstructor

type TypeType<T extends Type | null> = T extends null
  ? null
  : T extends ObjectConstructor
  ? Record<any, any>
  : T extends FunctionConstructor
  ? (...args: any[]) => any
  : T extends ArrayConstructor
  ? any[]
  : ReturnType<Exclude<T, null>>

type PropTypeBuilder<T> = {
  opt: {
    (): PropType<T, false, false>
    (defaultValue: T): PropType<T, true, false>
  }

  req: () => PropType<T, false, true>
}

type ExtPropTypeBuilder<T> = PropTypeBuilder<T> & {
  as<T2 extends T>(): PropTypeBuilder<T2>
}

type PropFunc = ExtPropTypeBuilder<any> & {
  bool: ExtPropTypeBuilder<boolean>
  num: ExtPropTypeBuilder<number>
  str: ExtPropTypeBuilder<string>
  obj: ExtPropTypeBuilder<Record<any, any>>
  func: ExtPropTypeBuilder<(...args: any[]) => any>
  arr: ExtPropTypeBuilder<any[]>

  nbool: ExtPropTypeBuilder<boolean | null>
  nnum: ExtPropTypeBuilder<number | null>
  nstr: ExtPropTypeBuilder<string | null>
  nobj: ExtPropTypeBuilder<Record<any, any> | null>
  nfunc: ExtPropTypeBuilder<((...args: any[]) => any) | null>
  narr: ExtPropTypeBuilder<any[] | null>

  evt<T = any>(): PropType<(event: T) => void, false, false>

  <T extends Type>(t: T): ExtPropTypeBuilder<TypeType<T>>

  <T1 extends Type | null, T2 extends Exclude<Type | null, T1>>(
    t1: T1,
    t2: T2
  ): ExtPropTypeBuilder<TypeType<T1> | TypeType<T2>>

  <
    T1 extends Type | null,
    T2 extends Exclude<Type | null, T1>,
    T3 extends Exclude<Type | null, T1 | T2>
  >(
    t1: T1,
    t2: T2,
    t3: T3
  ): ExtPropTypeBuilder<TypeType<T1> | TypeType<T2> | TypeType<T3>>

  <
    T1 extends Type | null,
    T2 extends Exclude<Type | null, T1>,
    T3 extends Exclude<Type | null, T1 | T2>,
    T4 extends Exclude<Type | null, T1 | T2 | T3>
  >(
    t1: T1,
    t2: T2,
    t3: T3,
    t4: T4
  ): ExtPropTypeBuilder<
    TypeType<T1> | TypeType<T2> | TypeType<T3> | TypeType<T4>
  >

  <
    T1 extends Type | null,
    T2 extends Exclude<Type | null, T1>,
    T3 extends Exclude<Type | null, T1 | T2>,
    T4 extends Exclude<Type | null, T1 | T2 | T3>,
    T5 extends Exclude<Type | null, T1 | T2 | T3 | T4>
  >(
    t1: T1,
    t2: T2,
    t3: T3,
    t4: T4,
    t5: T5
  ): ExtPropTypeBuilder<
    TypeType<T1> | TypeType<T2> | TypeType<T3> | TypeType<T4> | TypeType<T5>
  >

  <
    T1 extends Type | null,
    T2 extends Exclude<Type | null, T1>,
    T3 extends Exclude<Type | null, T1 | T2>,
    T4 extends Exclude<Type | null, T1 | T2 | T3>,
    T5 extends Exclude<Type | null, T1 | T2 | T3 | T4>,
    T6 extends Exclude<Type | null, T1 | T2 | T3 | T4 | T5>
  >(
    t1: T1,
    t2: T2,
    t3: T3,
    t4: T4,
    t5: T5
  ): ExtPropTypeBuilder<
    | TypeType<T1>
    | TypeType<T2>
    | TypeType<T3>
    | TypeType<T4>
    | TypeType<T5>
    | TypeType<T6>
  >

  <
    T1 extends Type | null,
    T2 extends Exclude<Type | null, T1>,
    T3 extends Exclude<Type | null, T1 | T2>,
    T4 extends Exclude<Type | null, T1 | T2 | T3>,
    T5 extends Exclude<Type | null, T1 | T2 | T3 | T4>,
    T6 extends Exclude<Type | null, T1 | T2 | T3 | T4 | T5>,
    T7 extends Exclude<Type | null, T1 | T2 | T3 | T4 | T5 | T6>
  >(
    t1: T1,
    t2: T2,
    t3: T3,
    t4: T4,
    t5: T5
  ): ExtPropTypeBuilder<
    | TypeType<T1>
    | TypeType<T2>
    | TypeType<T3>
    | TypeType<T4>
    | TypeType<T5>
    | TypeType<T6>
    | TypeType<T7>
  >
}

const prop: PropFunc = ((...args: any[]) => {
  if (args.length === 0) {
    throw new TypeError(
      'Function "prop" must be called with at least one argument'
    )
  }

  const typeHint = args.length === 1 ? args[0] : args

  return {
    opt: (defaultValue?: any) =>
      defaultValue === undefined
        ? { type: typeHint }
        : { type: typeHint, defaultValue },

    req: () => ({ type: typeHint, required: true }),

    as: () => ({
      opt: prop.opt,
      req: prop.req
    })
  }
}) as any // TODO

prop.opt = ((defaultValue?: any) =>
  defaultValue === undefined ? {} : { defaultValue }) as any

prop.req = () => ({ required: true } as any)

prop.as = () =>
  ({
    opt: prop.opt,
    req: prop.req
  } as any) // TODO?

prop.bool = prop(Boolean)
prop.num = prop(Number)
prop.str = prop(String)
prop.obj = prop(Object)
prop.func = prop(Function)
prop.arr = prop(Array)

prop.nbool = prop(Boolean, null)
prop.nnum = prop(Number, null)
prop.nstr = prop(String, null)
prop.nobj = prop(Object, null)
prop.nfunc = prop(Function, null)
prop.narr = prop(Array, null)

prop.evt = () => prop(Function).opt()
