import { component, h, prop } from '../../main/js-elements'
import { usePromise, useState } from '../../main/js-elements-ext'

component('data-loader', {
  props: {
    loadingText: prop.str.opt('Loading...'),
    finishText: prop.str.opt('Finished!'),
    key: prop.num.opt()
  },

  main(c, props) {
    const res = usePromise(
      c,
      () => wait(4000),
      () => [props.key]
    )

    return () =>
      res.state === 'pending' ? (
        <div>{props.loadingText}</div>
      ) : (
        <div>{props.finishText}</div>
      )
  }
})

component('promise-demo', (c) => {
  const [state, setState] = useState(c, {
    key: 0,
    loadingText: 'Loading...',
    finishText: 'Finished!'
  })

  const onRefresh = () => c.refresh()
  const onRestart = () => setState('key', (it: any) => it + 1) // TODO

  const onToggleLoadingText = () =>
    setState('loadingText', (it) =>
      it === 'Loading...' ? 'Please wait...' : 'Loading...'
    )

  const onToggleFinishText = () =>
    setState('finishText', (it) => (it === 'Finished!' ? 'Done!' : 'Finished!'))

  return () => (
    <div>
      <h3>Demo (last update {getTime()})</h3>
      <section>
        <data-loader
          key={state.key}
          loading-text={state.loadingText}
          finish-text={state.finishText}
        />
      </section>
      <br />
      <button onClick={onRefresh}>Refresh</button>
      <button onClick={onRestart}>Restart</button>
      <button onClick={onToggleLoadingText}>Toggle loading text</button>
      <button onClick={onToggleFinishText}>Toggle finish text</button>
    </div>
  )
})

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(() => resolve(), ms))
}

function getTime() {
  return new Date().toTimeString().substr(0, 8)
}
