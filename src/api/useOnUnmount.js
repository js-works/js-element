export default function useOnUnmount(c, callback) {
  return c.beforeUnmount(callback)
}