import { h, prop, stateful } from '../../main/js-elements'
import { withPromise, withState } from '../../main/js-elements-ext'

const DataLoader = stateful('data-loader', {
  props: {
    loadingText: prop.str.opt('Loading...'),
    finishText: prop.str.opt('Finished!'),
    key: prop.num.opt()
  },

  main(c, props) {
    const res = withPromise(
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

stateful('promise-demo', (c) => {
  const [state, setState] = withState(c, {
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
        <DataLoader
          key={state.key}
          loadingText={state.loadingText}
          finishText={state.finishText}
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
