import useEffect from './useEffect'
import asRef from './asRef'

function useInterval(c, callback, delay) {
  const
    callbackRef = asRef(callback),
    delayRef = asRef(delay)
  
  useEffect(c, () => {
    const id = setInterval(callbackRef.current, delayRef.current)

    return () => clearInterval(id)
  }, () => [callbackRef.current, delayRef.current])
}

export default useInterval
