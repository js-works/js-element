import asRef from './asRef'
import useValue from './useValue'
import useInterval from './useInterval'
import hook from './hook'
export default hook('useTime', (c, delay, getter = getDate) => {
  const
    delayRef = asRef(delay),
    getterRef = getter ? asRef(getter) : null,
  
    [value, setValue] =
      useValue(c, getterRef.current())

  useInterval(c, () => {
    setValue(getterRef.current())
  }, delayRef.curren)

  return value
})

function getDate() {
  return new Date()
}
