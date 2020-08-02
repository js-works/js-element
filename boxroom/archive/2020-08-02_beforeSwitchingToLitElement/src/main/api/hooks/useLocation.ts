import hook from './hook'
import useEffect from './useEffect'
import useState from './useState'
import Ctrl from '../#types/Ctrl'

const useLocation = hook('useLocation', (c: Ctrl): LocationInfo => {
  const [state, setState] = useState(c, getLocationInfo())

  useEffect(c, () => {
    const
      listener = () => {
        setState(getLocationInfo())
      }

    window.addEventListener('hashchange', listener)
    window.addEventListener('pushstate', listener)
    window.addEventListener('locationchange', listener)
    window.addEventListener('replacestate',listener)

    return () => {
      window.removeEventListener('hashchange', listener)
      window.removeEventListener('pushstate', listener)
      window.removeEventListener('locationchange', listener)
      window.removeEventListener('replacestate',listener)
    }
  }, null)

  return state
})

function getLocationInfo(): LocationInfo {
  const location = window.location

  return {
    href: location.href,
    protocol: location.protocol,
    host: location.host,
    hostname: location.hostname,
    port: location.port,
    pathname: location.pathname,
    search: location.search,
    hash: location.hash
  }
}

type LocationInfo = {
  href: string,
  protocol: string,
  host: string,
  hostname: string,
  port: string,
  pathname: string,
  search: string,
  hash: string
}

export default useLocation
