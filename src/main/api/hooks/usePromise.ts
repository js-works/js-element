import useState from './useState'
import useEffect from './useEffect'
import hook from './hook'
import Ctrl from '../#types/Ctrl'

const initialState: any = {
  result: undefined,
  error: undefined,
  state: 'pending'
}

export default hook('usePromise', usePromise)

function usePromise<T>(
  c: Ctrl,
  getPromise: () => Promise<T>,
  getDeps?: () => any[]
): {
  result: undefined | T,
  error: undefined | Error,
  state: 'pending' | 'resolved' | 'rejected'
} {
  const [state, setState] = useState(c, initialState)

  let promiseIdx = -1

  useEffect(c, () => {
    ++promiseIdx

    if (state.state !== 'pending') {
      setState(initialState)
    }

    const myPromiseIdx = promiseIdx
  
    getPromise()
      .then(result => {
        if (promiseIdx === myPromiseIdx) {
          setState({
            result,
            state: 'resolved'
          })
        }
      })
      .catch(error => {
        if (promiseIdx === myPromiseIdx) {
          setState({
            error: error instanceof Error ? error : new Error(String(error)),
            state: 'rejected'
          })
        }
      })
  }, typeof getDeps === 'function' ? getDeps : null)

  return state
}
