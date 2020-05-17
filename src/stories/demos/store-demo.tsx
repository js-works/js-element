import { defineElement, h, prop, send, StoreProvider, Component } from '../../main/index'

function createStore() {
  const data = {
    count: 0,
    subscriber: null as null | (() => void)
  }

  return {
    getState() {
      return {
        count: data.count
      }
    },

    dispatch(msg: any) {
      ++data.count
      data.subscriber && data.subscriber()
    },

    subscribe(subscriber: () => void): () => void {
      if (data.subscriber) {
        throw new Error('Sorry, only one subscriber allowed for this store')
      }

      data.subscriber = subscriber

      return () => {
        if (data.subscriber === subscriber) {
          data.subscriber = null
        }
      }
    }
  }
}

const StoreDemo = defineElement({
  name: 'store-demo',

  init(c) {
    const store = createStore()
    
    return () =>
      <StoreProvider store={store}>
        <h3>Current store state</h3>
        <pre>{JSON.stringify(store.getState(), null, 2)}</pre>
        <hr/>
        <DispatchButton/>
      </StoreProvider>
  }
})

const DispatchButton = defineElement('dispatch-button', c => {
  const
   onClick = () => send(c, { type: 'some.message' })

  return () =>
    <button onClick={onClick}>Send event</button>
})
