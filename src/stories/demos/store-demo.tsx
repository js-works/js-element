import { defineElement, html, prop } from '../../main/js-elements-lit-html'

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

const StoreDemo = defineElement('store-demo', (c) => {
  const store = createStore()

  return () => html`
    <store-provider .store=${store}>
      <h3>Current store state</h3>
      <pre>${JSON.stringify(store.getState(), null, 2)}</pre>
      <hr />
      <dispatch-button />
    </store-provider>
  `
})

const DispatchButton = defineElement('dispatch-button', (c) => {
  const onClick = () => c.send({ type: 'some.message' })

  return () => html`<button @click="{onClick}">Send event</button>`
})
