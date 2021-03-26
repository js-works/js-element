import { define, h } from 'js-element'
import { usePromise, useRefresher, useState } from 'js-element/hooks'

class DataLoaderProps {
  loadingText = 'Loading...'
  finishText = 'Finished!'
  key?: number
}

const DataLoader = define('data-loader', DataLoaderProps, (p) => {
  const res = usePromise(
    () => wait(4000),
    () => [p.key]
  )

  return () => {
    if (res.getState() === 'pending') {
      return <div>{p.loadingText}</div>
    } else {
      return <div>{p.finishText}</div>
    }
  }
})

const PromiseDemo = define('promise-demo', () => {
  const [s, set] = useState({
    key: 0,
    loadingText: 'Loading...',
    finishText: 'Finished!'
  })

  const refresh = useRefresher()
  const onRefresh = () => refresh()
  const onRestart = () => set('key', (it: any) => it + 1) // TODO

  const onToggleLoadingText = () =>
    set('loadingText', (it) =>
      it === 'Loading...' ? 'Please wait...' : 'Loading...'
    )

  const onToggleFinishText = () =>
    set('finishText', (it) => (it === 'Finished!' ? 'Done!' : 'Finished!'))

  return () => (
    <div>
      <h3>Demo (last update {getTime()})</h3>
      <section>
        <DataLoader
          key={s.key}
          loadingText={s.loadingText}
          finishText={s.finishText}
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

export default PromiseDemo
