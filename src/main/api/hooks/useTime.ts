import asRef from '../util/asRef'
import useValue from './useValue'
import useInterval from './useInterval'
import hook from './hook'
import R from '../#types/R'

export default hook('useTime', (c, delay: R<number>, getter: R<() => any> = getDate) => {
  const
    delayRef = asRef(delay),
    getterRef = asRef(getter),
  
    [value, setValue] =
      useValue(c, getterRef.current())

  useInterval(c, () => {
    setValue(getterRef.current())
  }, delayRef.current)

  return value
})

function getDate() {
  return new Date()
}
