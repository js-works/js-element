export default function useOnMount(c, callback) {
  return c.afterMount(callback)
}