export default function useEffect(c, action, getDeps) {
  let
    oldDeps = null,
    cleanup = null

  const callback = () => {
    const newDeps = typeof getDeps === 'function' ? getDeps() : null

    if (oldDeps === null || newDeps ===  null || !isEqual(oldDeps, newDeps)) {
      if (cleanup) {
        cleanup()
        cleanup = null
      }

      cleanup = action()
    }

    oldDeps = newDeps
  }

  c.afterMount(callback)
  c.afterRefresh(callback)
}

// --- locals -------------------------------------------------------

function isEqual(arr1, arr2) {
  let ret = Array.isArray(arr1) && Array.isArray(arr2) && arr1.length === arr2.length

  if (ret) {
    for (let i = 0; i < arr1.length; ++i) {
      if (arr1[i] !== arr2[i]) {
        ret = false
        break
      }
    }
  }

  return ret
}
