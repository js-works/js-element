import hook from './hook'
import Ctrl from '../#types/Ctrl'
import Methods from '../#types/Methods'

export default hook('useMethods', useMethods)

function useMethods<M extends Methods>(c: Ctrl<{}, M>, methods: M) {
  console.log(1111,c.getProps())
  c.setMethods(methods)
}
