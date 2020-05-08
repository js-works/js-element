import hook from './hook'
import useEffect from './useEffect'
import asRef from '../util/asRef'
import R from '../#types/R'

export default hook('useInterval', (
  c,
  callback: R<() => void>,
  delay: R<number>
) => {
  const
    callbackRef = asRef(callback),
    delayRef = asRef(delay)
  
  useEffect(c, () => {
    const id = setInterval(callbackRef.current, delayRef.current)

    return () => clearInterval(id)
  }, () => [callbackRef.current, delayRef.current])
})
