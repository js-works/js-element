import supplier from './supplier'
import useValue from './useValue'
import useInterval from './useInterval'

function useTime(c, delay, getter = getDate) {
  const
    $delay = supplier(delay),
    $getter = getter ? supplier(getter) : null,
  
    [value, setValue] =
      useValue(c, $getter.get())

  useInterval(c, () => {
    setValue($getter.get()())
  }, $delay)

  return value
}

function getDate() {
  return new Date()
}

export default useTime
