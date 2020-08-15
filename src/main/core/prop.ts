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

type PropConfigBuilder<Type, TypeHint> = {
  opt(): { type: TypeHint }
  opt(defaultValue: Type): { type: TypeHint; defaultValue: Type }
  req(): { type: TypeHint; required: true }
}

type PropConfigBuilderWithoutTypeHint<Type> = {
  opt(): {}
  opt(defaultValue: Type): { defaultValue: Type }
  req(): { required: true }
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

  opt(): {}
  opt<T>(defaultValue: T): { defaultValue: T }
  req(): { required: true }
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
          ? { type: types }
          : {
              type: types,
              defaultValue
            },

      req: () => ({
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

  prop.opt = () => ({})
  prop.req = () => ({ required: true })

  return Object.freeze(prop)
})()

/*
function prop(): PropConfigBuilder<any, null>

function prop<A extends (AllowedConstructors | null)[]>(
  ...types: A
): PropConfigBuilder<RetTypes<A>, A>

// ---

function prop<T extends AllowedConstructors>(
  type: T
): PropConfigBuilder<RetType<T>, T>

function prop<T1 extends AllowedConstructors, T2 extends AllowedConstructors>(
  type1: T1,
  type2: T2
): PropConfigBuilder<RetType<T1> | RetType<T2>, (T1 | T2)[]>

function prop<
  T1 extends AllowedConstructors,
  T2 extends AllowedConstructors,
  T3 extends AllowedConstructors
>(
  type1: T1,
  type2: T2,
  type3: T3
): PropConfigBuilder<RetType<T1> | RetType<T2> | RetType<T3>, (T1 | T2 | T3)[]>

function prop<
  T1 extends AllowedConstructors,
  T2 extends AllowedConstructors,
  T3 extends AllowedConstructors,
  T4 extends AllowedConstructors
>(
  type1: T1,
  type2: T2,
  type3: T3,
  type4: T4
): PropConfigBuilder<
  RetType<T1> | RetType<T2> | RetType<T3> | RetType<T4>,
  (T1 | T2 | T3 | T4)[]
>

function prop<
  T1 extends AllowedConstructors,
  T2 extends AllowedConstructors,
  T3 extends AllowedConstructors,
  T4 extends AllowedConstructors,
  T5 extends AllowedConstructors
>(
  type1: T1,
  type2: T2,
  type3: T3,
  type4: T4,
  type5: T5
): PropConfigBuilder<
  RetType<T1> | RetType<T2> | RetType<T3> | RetType<T4> | RetType<T5>,
  (T1 | T2 | T3 | T4 | T5)[]
>

function prop<T extends AllowedConstructors>(
  type: T,
  nul: null
): PropConfigBuilder<RetType<T> | null, [T, null]>

function prop<T1 extends AllowedConstructors, T2 extends AllowedConstructors>(
  type1: T1,
  type2: T2,
  nul: null
): PropConfigBuilder<RetType<T1> | RetType<T2> | null, (T1 | T2 | null)[]>

function prop<
  T1 extends AllowedConstructors,
  T2 extends AllowedConstructors,
  T3 extends AllowedConstructors
>(
  type1: T1,
  type2: T2,
  type3: T3,
  nul: null
): PropConfigBuilder<
  RetType<T1> | RetType<T2> | RetType<T3> | null,
  (T1 | T2 | T3 | null)[]
>

function prop<
  T1 extends AllowedConstructors,
  T2 extends AllowedConstructors,
  T3 extends AllowedConstructors,
  T4 extends AllowedConstructors
>(
  type1: T1,
  type2: T2,
  type3: T3,
  type4: T4,
  nul: null
): PropConfigBuilder<
  RetType<T1> | RetType<T2> | RetType<T3> | RetType<T4> | null,
  (T1 | T2 | T3 | T4 | null)[]
>

function prop<
  T1 extends AllowedConstructors,
  T2 extends AllowedConstructors,
  T3 extends AllowedConstructors,
  T4 extends AllowedConstructors,
  T5 extends AllowedConstructors
>(
  type1: T1,
  type2: T2,
  type3: T3,
  type4: T4,
  type5: T5,
  nul: null
): PropConfigBuilder<
  RetType<T1> | RetType<T2> | RetType<T3> | RetType<T4> | RetType<T5> | null,
  (T1 | T2 | T3 | T4 | T5 | null)[]
>
*/

/*

function prop<T extends boolean = boolean>(
  type: BooleanConstructor
): PropConfigBuilder<T, BooleanConstructor>

function prop<T extends number = number>(
  type: NumberConstructor
): PropConfigBuilder<T, NumberConstructor>

function prop<T extends string = string>(
  type: StringConstructor
): PropConfigBuilder<T, StringConstructor>

function prop<T extends Object = object>(
  type: ObjectConstructor
): PropConfigBuilder<T, ObjectConstructor>

function prop<T extends Func = Func>(
  type: FunctionConstructor
): PropConfigBuilder<T, FunctionConstructor>

function prop<T extends any[]>(
  type: ArrayConstructor
): PropConfigBuilder<T, ArrayConstructor>

function prop<T extends boolean | null = boolean | null>(
  type: BooleanConstructor,
  nul: T extends null ? null : never
): PropConfigBuilder<T, [BooleanConstructor, null]>

function prop<T extends number | null = number | null>(
  type: NumberConstructor,
  nul: T extends null ? null : never
): PropConfigBuilder<T, [NumberConstructor, null]>

function prop<T extends string | null = string | null>(
  type: StringConstructor,
  nul: T extends null ? null : never
): PropConfigBuilder<T, [StringConstructor, null]>

function prop<T extends Object | null = object | null>(
  type: ObjectConstructor,
  nul: T extends null ? null : never
): PropConfigBuilder<T, [ObjectConstructor, null]>

function prop<T extends Func | null = Func | null>(
  type: FunctionConstructor,
  nul: T extends null ? null : never
): PropConfigBuilder<T, [FunctionConstructor, null]>

function prop<T extends any[] | null = any[] | null>(
  type: ArrayConstructor,
  nul: T extends null ? null : never
): PropConfigBuilder<T, [ArrayConstructor, null]>

function prop<T extends null>(
  ...types: (AllowedConstructors | null)[]
): PropConfigBuilder<T, typeof types>


function prop<T>(
  type1: AllowedConstructors,
  type2: AllowedConstructors,
  type3: AllowedConstructors | null,
): PropConfigBuilder<T, [typeof type1, typeof type2, typeof type3]>

function prop<T>(
  type1: AllowedConstructors,
  type2: AllowedConstructors,
  type3: AllowedConstructors,
  type4: AllowedConstructors | null,
): PropConfigBuilder<T, [typeof type1, typeof type2, typeof type3, typeof type4]>


function prop(...args: any[]): any {
  /*
  return {
    opt: (defaultValue: any) =>
      defaultValue === undefined
        ? { type }
        : {
            type,
            defaultValue
          },

    req: () => ({
      type,
      required: true
    })
  }
}
  */
