import { defineElement, html, prop } from '../../main/js-elements'
import { usePromise, useState } from '../../main/js-elements-ext'

defineElement('data-loader', {
  props: {
    loadingText: prop.str.opt('Loading...'),
    finishText: prop.str.opt('Finished!'),
    key: prop.num.opt()
  },

  init(c, props) {
    const res = usePromise(
      c,
      () => wait(4000),
      () => [props.key]
    )

    return () =>
      res.state === 'pending'
        ? html`<div>${props.loadingText}</div>`
        : html`<div>${props.finishText}</div>`
  }
})

defineElement('promise-demo', (c) => {
  const [state, setState] = useState(c, {
    key: 0,
    loadingText: 'Loading...',
    finishText: 'Finished!'
  })

  const onRefresh = () => c.refresh()
  const onRestart = () => setState('key', (it: any) => it + 1) // TODO

  const onToggleLoadingText = () =>
    setState('loadingText', (it: any) =>
      it === 'Loading...' ? 'Please wait...' : 'Loading...'
    ) // TODO

  const onToggleFinishText = () =>
    setState('finishText', (it: any) =>
      it === 'Finished!' ? 'Done!' : 'Finished!'
    ) // TODO

  return () => html`
    <div>
      <h3>Demo (last update ${getTime()})</h3>
      <section>
        <data-loader
          key=${state.key}
          loading-text=${state.loadingText}
          finish-text=${state.finishText}
        />
      </section>
      <br />
      <button @click=${onRefresh}>Refresh</button>
      <button @click=${onRestart}>Restart</button>
      <button @click=${onToggleLoadingText}>Toggle loading text</button>
      <button @click=${onToggleFinishText}>Toggle finish text</button>
    </div>
  `
})

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(() => resolve(), ms))
}

function getTime() {
  return new Date().toTimeString().substr(0, 8)
}
