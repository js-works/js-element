import hook from './hook'
import useEffect from './useEffect'
import asRef from '../util/asRef'
import ValueOrRef from '../#types/ValueOrRef'

export default hook('useInterval', (
  c,
  callback: ValueOrRef<() => void>,
  delay: ValueOrRef<number>
) => {
  const
    callbackRef = asRef(callback),
    delayRef = asRef(delay)
  
  useEffect(c, () => {
    const id = setInterval(callbackRef.current, delayRef.current)

    return () => clearInterval(id)
  }, () => [callbackRef.current, delayRef.current])
})
