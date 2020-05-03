import hook from './hook'
import useValue from './useValue'
export default hook('useToggle', (initialValue = false) => {
  const [toggle, setToggle] = useValue(initialValue)

  return [toggle, () => setToggle(it => !it)] 
})

