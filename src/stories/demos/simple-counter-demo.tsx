import { component, h, prop } from 'js-elements'
import { useEffect, useOnMount, useState } from 'js-elements/hooks'

const SimpleCounter = component('simple-counter', {
  props: {
    initialCount: prop.num.opt(0),
    label: prop.str.opt('Counter'),

    onChange: prop.evt<{
      type: 'change'
      value: number
    }>()
  }
})((c, props) => {
  const [state, setState] = useState(c, {
    count: props.initialCount
  })

  const onIncrement = () => setState('count', (it) => it + 1)

  useOnMount(c, () => {
    console.log('Simple counter has been mounted')

    return () => console.log('Simple counter will be umounted')
  })

  useEffect(c)(
    () => console.log(`Value of "${props.label}": ${state.count}`),
    () => [state.count]
  )

  useEffect(c)(
    () => {
      if (props.onChange && c.hasUpdated()) {
        props.onChange({
          type: 'change',
          value: state.count
        })
      }
    },

    () => [state.count]
  )

  return () => (
    <div>
      <label>{props.label}: </label>
      <button onClick={onIncrement}>{state.count}</button>
    </div>
  )
})

component('simple-counter-demo')(() => {
  const onChange = (ev: any) => console.log('Event:', ev)

  return () => (
    <div>
      <h3>Counter demo</h3>
      <div>
        <SimpleCounter onChange={onChange} />
      </div>
    </div>
  )
})
