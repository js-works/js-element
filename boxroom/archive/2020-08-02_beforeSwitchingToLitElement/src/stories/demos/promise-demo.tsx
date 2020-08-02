/** @jsx h */
import { defineElement, h, prop, update, usePromise, useState, Component } from '../../main/index'

type LoaderProps = {
  loadingText?: string,
  finishText?: string
}

const Loader: Component<LoaderProps> = defineElement({
  name: 'data-loader',

  props: {
    loadingText: prop.str.opt('Loading...'),
    finishText: prop.str.opt('Finished!')
  },

  init(c, props) {
    const res = usePromise(c, () => wait(4000))

    return () => res.state === 'pending'
      ? <div>{props.loadingText}</div>
      : <div>{props.finishText}</div>
  }
})

defineElement('promise-demo', c => {
  const
    [state, setState] = useState(c, {
      key: 0,
      loadingText: 'Loading...',
      finishText: 'Finished!'
    }),

    onRefresh = () => update(c),
    onRestart = () => setState('key', (it: any) => it + 1), // TODO

    onToggleLoadingText = () => setState('loadingText',
      (it: any) => it === 'Loading...' ? 'Please wait...' : 'Loading...'), // TODO

    onToggleFinishText = () => setState('finishText',
      (it: any) => it === 'Finished!' ? 'Done!' : 'Finished!') // TODO

  return () => (
    <div>
      <h3>Demo (last update {getTime()})</h3>
      <section>
        <Loader key={state.key} loadingText={state.loadingText} finishText={state.finishText}/>
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
  return new Promise(resolve =>
    setTimeout(() => resolve(), ms))
}

function getTime() {
  return new Date().toTimeString().substr(0, 8)
}
