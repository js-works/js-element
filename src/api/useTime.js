import supplier from './supplier'
import useValue from './useValue'
import useInterval from './useInterval'

function useTime(c, delay, mapper) {
  const
    $delay = supplier(delay),
    $mapper = mapper ? supplier(mapper) : null,
  
    [time, setTime] =
      useValue(c, $mapper ? $mapper.get()(new Date()) : new Date())

  useInterval(c, () => {
    let value = new Date()

    if ($mapper) {
      value = $mapper.get()(value)
    }

    setTime(value)
  }, $delay)

  return time
}

export default useTime
