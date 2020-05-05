import hook from './hook'

export default hook('useMethods', (c, methods) => {
  c.setMethods(methods)
})
