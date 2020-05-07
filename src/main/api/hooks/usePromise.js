import useState from './useState'
import useEffect from './useEffect'
import hook from './hook'

const initialState = {
  result: undefined,
  error: undefined,
  state: 'pending'
}

export default hook('usePromise', (c, getPromise, getDeps) => {
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
})
