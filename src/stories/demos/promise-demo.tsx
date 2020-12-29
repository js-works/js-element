import { define, h, prop } from 'js-elements'
import { usePromise, useRefresher, useState } from 'js-elements/hooks'

class DataLoaderProps {
  @prop()
  loadingText = 'Loading...'

  @prop()
  finishText = 'Finished!'

  @prop()
  key?: number
}

const DataLoader = define('data-loader', DataLoaderProps, (props) => {
  const res = usePromise(
    () => wait(4000),
    () => [props.key]
  )

  return () => {
    if (res.getState() === 'pending') {
      return <div>{props.loadingText}</div>
    } else {
      return <div>{props.finishText}</div>
    }
  }
})

export default define('promise-demo', () => {
  const [state, setState] = useState({
    key: 0,
    loadingText: 'Loading...',
    finishText: 'Finished!'
  })

  const refresh = useRefresher()
  const onRefresh = () => refresh()
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
  return new Promise((resolve) => setTimeout(() => resolve(null), ms))
}

function getTime() {
  return new Date().toTimeString().substr(0, 8)
}
