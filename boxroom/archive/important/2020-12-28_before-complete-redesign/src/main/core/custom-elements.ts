/*
// === StoreProvider =================================================

defineElement('store-provider', {
  props: {
    store: {
      required: true
    }
  },

  main(c, props) {
    let key = 0

    c.effect(
      () => {
        const unsubscribe1 = c.receive((msg: Message) => {
          ;(props.store as any).dispatch(msg) // TODO
        })

        // TODO
        const unsubscribe2 = (props.store as any).subscribe(() => {
          c.refresh()
        })

        return () => {
          unsubscribe1()
          unsubscribe2()
        }
      },
      () => [props.store]
    )

    return html`<slot></slot>`
  }
})
*/
