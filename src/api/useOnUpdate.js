export default function useOnUpdate(c, callback) {
  return c.afterUpdate(callback)
}
