import useEffect from './useEffect'
import supplier from './supplier'

function useInterval(c, callback, delay) {
  const
    $callback = supplier(callback),
    $delay = supplier(delay)
  
  useEffect(c, () => {
    const id = setInterval($callback.get(), $delay.get())

    return () => clearInterval(id)
  }, () => [$callback.get(), $delay.get()])
}

export default useInterval
