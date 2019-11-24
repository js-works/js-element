export default function useOnRefresh(c, callback) {
  return c.afterRefresh(callback)
}
