import hook from './hook'
import globals from '../internal/globals'
export default hook('useEffect', (action, getDeps) => {
  let
    oldDeps = null,
    cleanup
  
  const c = globals.currentComponent

  if (getDeps === null) {
    c._afterMount(() => { cleanup = action() })
    c._beforeUnmount(() => { cleanup && cleanup() }) 
  } else if (getDeps === undefined || typeof getDeps === 'function'){
    const callback = () => {
      let needsAction = getDeps === undefined

      if (!needsAction) {
        const newDeps = getDeps()

        needsAction = oldDeps === null || newDeps ===  null || !isEqual(oldDeps, newDeps)
        oldDeps = newDeps
      }

      if (needsAction) {
        cleanup && cleanup()
        cleanup = action()
      }
    }

    c._afterMount(callback)
    c._afterUpdate(callback)
  } else {
    throw new TypeError(
      '[useEffect] Third argument must either be undefined, null or a function')
  }
})

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
