import hook from './hook'
import Ctrl from '../#types/Ctrl'
import Action from '../../internal/#types/Action'

export default hook('useEffect', (
  c: Ctrl,
  action: Action | Action<[], Action | null | undefined>,
  getDeps?: null | (() => any[])
): void => {
  let
    oldDeps: (any[] | null) = null,
    cleanup: Action | null | undefined | void
  
  if (getDeps === null) {
    c.afterMount(() => { cleanup = action() })
    c.beforeUnmount(() => { cleanup && cleanup() }) 
  } else if (getDeps === undefined || typeof getDeps === 'function'){
    const callback = () => {
      let needsAction = getDeps === undefined

      if (!needsAction) {
        const newDeps = getDeps!()

        needsAction = oldDeps === null || newDeps ===  null || !isEqual(oldDeps, newDeps)
        oldDeps = newDeps
      }

      if (needsAction) {
        cleanup && cleanup()
        cleanup = action()
      }
    }

    c.afterMount(callback)
    c.afterUpdate(callback)
  } else {
    throw new TypeError(
      '[useEffect] Third argument must either be undefined, null or a function')
  }
})

// --- locals --------------------------------------------------------

function isEqual(arr1: any[], arr2: any[]) {
  let ret =
    Array.isArray(arr1) && Array.isArray(arr2) && arr1.length === arr2.length

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
