import hook from './hook'
import useValue from './useValue'

export default hook('useToggle', (c, initialValue: boolean = false) => {
  const [toggle, setToggle] = useValue(c, initialValue)

  return [toggle, () => setToggle(it => !it)] 
})

