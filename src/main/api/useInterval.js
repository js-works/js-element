import useEffect from './useEffect'
import asRef from './asRef'
import hook from './hook'
export default hook('useInterval', (callback, delay) => {
  const
    callbackRef = asRef(callback),
    delayRef = asRef(delay)
  
  useEffect(() => {
    const id = setInterval(callbackRef.current, delayRef.current)

    return () => clearInterval(id)
  }, () => [callbackRef.current, delayRef.current])
})
