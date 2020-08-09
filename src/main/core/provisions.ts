// === imports =======================================================

import { Ctrl } from 'types'

// === exports =======================================================

export { provision }

// === provision =====================================================

type ProvisionSubscriber<T> = {
  notifyChange(newValue: T): void
}

let counter = 0

function getNewEventType(): string {
  return `$$provision$$_${++counter}`
}

function provision<T>(
  name: string,
  defaultValue: T
): [(c: Ctrl, value: T) => void, (c: Ctrl) => T] {
  const subscribeEventType = getNewEventType()
  const providersMap = new Map<Ctrl, [T, Set<ProvisionSubscriber<any>>]>()
  const consumersMap = new Map<Ctrl, () => T>()

  const provideProvision = (c: Ctrl, value: T) => {
    if (!providersMap.has(c)) {
      if (c.isMounted()) {
        throw new Error(
          'First invocation of provision provider function must be performed before first component rendering'
        )
      }

      const onSubscribe = (ev: any) => {
        ev.stopPropagation()
        const subscriber = ev.detail
        const [value, subscribers] = providersMap.get(c)!

        subscribers.add(subscriber)

        subscriber.cancelled.then(() => {
          subscribers.delete(subscriber)
        })

        subscriber.notifyChange(value)
      }

      providersMap.set(c, [value, new Set()])
      c.getContentElement().addEventListener(subscribeEventType, onSubscribe)

      c.beforeUnmount(() => {
        c.getContentElement().removeEventListener(
          subscribeEventType,
          onSubscribe
        )
        providersMap.delete(c)
      })
    } else {
      const data = providersMap.get(c)!

      if (value !== data[0]) {
        data[0] = value

        data[1].forEach((subscriber) => {
          subscriber.notifyChange(value)
        })
      }
    }
  }

  const consumeProvision = function (c: Ctrl) {
    let currentValue: T
    let getter = consumersMap.get(c)

    if (!getter) {
      if (c.isMounted()) {
        throw new Error(
          'First invocation of provision consumer function must be performed before first component rendering'
        )
      }

      getter = () => (currentValue !== undefined ? currentValue : defaultValue)
      consumersMap.set(c, getter)

      let cancel: any = null // will be set below // TODO

      c.beforeUnmount(() => cancel && cancel())

      c.getElement().dispatchEvent(
        new CustomEvent(subscribeEventType, {
          bubbles: true,
          detail: {
            notifyChange(newValue) {
              currentValue = newValue
              c.refresh() // TODO: optimize
            },

            cancelled: new Promise((resolve) => {
              cancel = resolve
            })
          } as ProvisionSubscriber<T>
        })
      )
    }

    return getter()
  }

  return [provideProvision, consumeProvision]
}
