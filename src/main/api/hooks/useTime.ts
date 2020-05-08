import asRef from '../util/asRef'
import useValue from './useValue'
import useInterval from './useInterval'
import hook from './hook'
import Ctrl from '../#types/Ctrl'
import ValueOrRef from '../#types/ValueOrRef'

export default hook('useTime', useTime)

function useTime<T>(
  c: Ctrl,
  delay: ValueOrRef<number>,
  getter: ValueOrRef<() => T>
): { value: T }

function useTime(
  c: Ctrl,
  delay: ValueOrRef<number>
): { value: Date }

function useTime(
  c: Ctrl,
  delay: ValueOrRef<number>,
  getter: ValueOrRef<() => any> = getDate
): { value: any } {
  const
    delayRef = asRef(delay),
    getterRef = asRef(getter),
  
    [value, setValue] =
      useValue(c, getterRef.current())

  useInterval(c, () => {
    setValue(getterRef.current())
  }, delayRef.current)

  return value
}

function getDate() {
  return new Date()
}
