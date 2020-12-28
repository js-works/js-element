import { element, html, prop } from 'js-elements'
import { usePromise, useRefresher, useState } from 'js-elements/hooks'

@element('data-loader')
class DataLoader {
  @prop()
  loadingText = 'Loading...'

  @prop()
  finishText = 'Finished!'

  @prop()
  key?: number

  static main(self: DataLoader) {
    const res = usePromise(
      () => wait(4000),
      () => [self.key]
    )

    return () => {
      if (res.getState() === 'pending') {
        return html`<div>${self.loadingText}</div>`
      } else {
        return html`<div>${self.finishText}</div>`
      }
    }
  }
}

@element('promise-demo')
export default class PromiseDemo {
  static main() {
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
      setState('finishText', (it) =>
        it === 'Finished!' ? 'Done!' : 'Finished!'
      )

    return () => html`
      <div>
        <h3>Demo (last update ${getTime()})</h3>
        <section>
          <${DataLoader}
            key=${state.key}
            loadingText=${state.loadingText}
            finishText=${state.finishText}
          />
        </section>
        <br />
        <button onClick=${onRefresh}>Refresh</button>
        <button onClick=${onRestart}>Restart</button>
        <button onClick=${onToggleLoadingText}>Toggle loading text</button>
        <button onClick=${onToggleFinishText}>Toggle finish text</button>
      </div>
    `
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(() => resolve(null), ms))
}

function getTime() {
  return new Date().toTimeString().substr(0, 8)
}
