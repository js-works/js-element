import defineElement from '../core/defineElement'
import h from '../core/h'
import prop from './prop'
import receive from './receive'
import useEffect from '../hooks/useEffect'
import Component from '../#types/Component'
import VNode from '../#types/VNode'

type StoreProviderProps = {
  store: any | {
    dispatch(msg: any): void,
    getState(): any,
    subscribe(subscriber: (() => void)): () => void
  },

  children: VNode
}

const StoreProvider: Component<StoreProviderProps> = defineElement({
  name: 'store-provider',

  props: {
    store: prop.obj.opt(), // TODO
    children: prop.opt() // TODO
  },

  init(c, props) {
    let key = 0

    useEffect(c, () => {
      const
        unsubscribe1 = receive(c, (msg: any) => {
          props.store.dispatch(msg)
        }),

        unsubscribe2 = props.store.subscribe(() => {
          console.log(props.store.getState())
          c.update()
        })

      return () => {
        unsubscribe1()
        unsubscribe2()
      }
    }, () => [props.store])

    return () => h('slot') 
  }
})


export default StoreProvider
