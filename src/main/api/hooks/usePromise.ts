import useState from './useState'
import useEffect from './useEffect'
import hook from './hook'
import Ctrl from '../#types/Ctrl'

export default hook('usePromise', usePromise)

type Res<T> = {
  result: undefined,
  error: undefined,
  state: 'pending'
} | {
  result: T,
  error: undefined,
  state: 'resolved'
} | {
  result: undefined,
  error: Error,
  state: 'rejected'
}

const initialState: Res<any> = {
  result: undefined,
  error: undefined,
  state: 'pending'
}

function usePromise<T>(
  c: Ctrl,
  getPromise: () => Promise<T>,
  getDeps?: () => any[]
): Res<T> {
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
