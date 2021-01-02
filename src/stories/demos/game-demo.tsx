import { define, h } from 'js-elements'
import { defineMessages } from 'js-messages'
import { createReducer, on } from 'js-reducers'
import { of } from 'rxjs'
import { delay, map, mergeMap, repeat, repeatWhen, tap } from 'rxjs/operators'

import {
  createStoreHooks,
  useActions,
  useOnMount,
  useState,
  useStyles,
  useTimer
} from 'js-elements/hooks'

import { createStore, createEffects, ofType } from '../libs/js-stores'

// === constants =====================================================

const FRONT_COLOR = '#0cb'
const BACK_COLOR = '#444'
const FIELD_WIDTH = 400
const FIELD_HEIGHT = 200
const BALL_COLOR = '#f33'
const BALL_RADIUS = 4
const BALL_SPEED = 100
const BALL_MAX_SPEED = 200
const BALL_ACCELERATION = 1
const RACKET_COLOR = '#fb0'
const RACKET_WIDTH = 65
const RACKET_HEIGHT = 10
const RACKET_SPEED = 100
const COUNTDOWN_DURATION = 6000

// === types =========================================================

type AppState = {
  ball: { x: number; y: number }
  racket: { x: number; y: number }
  score: number
  highscore: number
  mode: AppMode
}

type AppMode = 'normal' | 'countdown' | 'alarm'

// === messages ======================================================

const StateMsg = defineMessages('state', {
  initGame: null,
  setBallPos: (x: number, y: number) => ({ x, y }),
  setRacketPos: (x: number, y: number) => ({ x, y }),
  setScore: (score: number) => ({ score }),
  setHighscore: (highscore: number) => ({ highscore }),
  setMode: (mode: AppMode) => ({ mode })
})

const ActionMsg = defineMessages('action', {
  startGame: null,
  finishGame: (score: number) => ({ score }),
  moveRacketLeft: null,
  moveRacketRight: null
})

// === initial app state =============================================

const initialState: AppState = {
  ball: {
    x: 0,
    y: 0
  },

  racket: {
    x: Math.floor((FIELD_WIDTH - RACKET_WIDTH) / 2),
    y: FIELD_HEIGHT - RACKET_HEIGHT
  },

  score: 0,
  highscore: 0,
  mode: 'normal'
}

// === state reducer ================================================

const stateReducer = createReducer(initialState, [
  on(StateMsg.initGame, (state) => {
    state.mode = 'normal'
    state.ball.x = 0
    state.ball.y = 0
    state.racket.x = Math.floor((FIELD_WIDTH - RACKET_WIDTH) / 2)
  }),

  on(StateMsg.setBallPos, (state, { x, y }) => {
    state.ball.x = x
    state.ball.y = y
  }),

  on(StateMsg.setRacketPos, (state, { x, y }) => {
    state.racket.x = x
    state.racket.y = y
  }),

  on(StateMsg.setScore, (state, { score }) => {
    state.score = score
  }),

  on(StateMsg.setHighscore, (state, { highscore }) => {
    state.highscore = highscore
  }),

  on(StateMsg.setMode, (state, { mode }) => {
    state.mode = mode
  })
])

// === state selectors ===============================================

const StateSel = {
  ballPos: (state: AppState) => ({
    x: state.ball.x,
    y: state.ball.y
  }),

  racketPos: (state: AppState) => ({
    x: state.racket.x,
    y: state.racket.y
  }),

  scores: (state: AppState) => ({
    score: state.score,
    highscore: state.score
  }),

  mode: (state: AppState) => state.mode
}

// === effects =======================================================

const effects = createEffects<AppState>((msg$, _, getState) => ({
  startGame: msg$.pipe(
    ofType(ActionMsg.startGame),
    mergeMap(() => [StateMsg.initGame(), StateMsg.setMode('countdown')])
  ),

  finishGame: msg$.pipe(
    ofType(ActionMsg.finishGame),
    tap(() => console.log('juhu')),
    map(() => StateMsg.setMode('alarm')),
    delay(3000),
    map(() => ActionMsg.startGame())
  ),

  moveRacketLeft: msg$.pipe(
    ofType(ActionMsg.moveRacketLeft),
    map(() => {
      const state = getState()
      const racket = getState().racket
      const newX = Math.max(racket.x - RACKET_SPEED / 2, 0)

      return StateMsg.setRacketPos(newX, racket.y)
    })
  ),

  moveRacketRight: msg$.pipe(
    ofType(ActionMsg.moveRacketRight),
    map(() => {
      const state = getState()
      const racket = getState().racket

      const newX = Math.min(
        racket.x + RACKET_SPEED / 2,
        FIELD_WIDTH - RACKET_WIDTH
      )

      return StateMsg.setRacketPos(newX, racket.y)
    })
  )
}))

// === game logic ====================================================

class GameLogic {
  #store = createStore(stateReducer, initialState, effects)

  getStore() {
    return this.#store
  }
}

// === hooks =========================================================

const [useStoreProvider, useSelectors] = createStoreHooks<AppState>()

// === components ====================================================

const Field = define('x-field', () => {
  useStyles(styles.field)

  const style = `
    width: ${FIELD_WIDTH}px;
    height: ${FIELD_HEIGHT}px;
  `

  return () => (
    <div class="root" style={style}>
      <slot />
    </div>
  )
})

const Ball = define('x-ball', () => {
  const stateSel = useSelectors(StateSel)

  useStyles(styles.ball)

  return () => {
    const style = `
      top: ${stateSel.ballPos.y}px;
      left: ${stateSel.ballPos.x}px;
      width: ${BALL_RADIUS * 2}px;
      height: ${BALL_RADIUS * 2}px;
    `
    return <div class="root" style={style} />
  }
})

const Racket = define('x-racket', () => {
  const stateSel = useSelectors(StateSel)

  useStyles(styles.racket)

  return () => {
    const style = `
      top: ${stateSel.racketPos.y}px;
      left: ${stateSel.racketPos.x}px;
      width: ${RACKET_WIDTH}px;
      height: ${RACKET_HEIGHT}px;
    `
    return <div class="root" style={style} />
  }
})

const Scoreboard = define('x-scoreboard', () => {
  const stateSel = useSelectors(StateSel)

  useStyles(styles.scoreboard)

  return () => {
    const { score, highscore } = stateSel.scores

    return (
      <div class="root">
        Score: {score} &nbsp; Highscore: {highscore}
      </div>
    )
  }
})

const CountdownPane = define('x-countdown-pane', () => {
  const [s, set] = useState({
    text: '',
    fontSize: 20
  })

  const ms = COUNTDOWN_DURATION / 5

  useStyles(styles.countdownPane)

  useOnMount(() => {
    setTimeout(() => set('text', 'Ready...'), ms)
    setTimeout(() => set({ text: 'Steady...', fontSize: 21 }), 2 * ms)
    setTimeout(() => set({ text: 'GOOOOOO!', fontSize: 26 }), 3 * ms)
    setTimeout(() => set('text', ''), 4 * ms)
  })

  return () => (
    <div class="root" style={`font-size: ${s.fontSize}px`}>
      {s.text}
    </div>
  )
})

const AlarmPane = define('x-alert-pane', () => {
  const getLightClass = useTimer(150, (idx) =>
    idx % 2 === 0 ? 'light' : 'dark'
  )

  useStyles(styles.alertPane)

  return () => <div class={`root ${getLightClass()}`} />
})

const Game = define('x-game', () => {
  useStyles(styles.game)
  const actions = useActions(ActionMsg)
  const stateSel = useSelectors(StateSel)

  useOnMount(() => {
    const keyDownListener = (ev: any) => {
      if (ev.keyCode === 37) {
        actions.moveRacketLeft()
      } else if (ev.keyCode === 39) {
        actions.moveRacketRight()
      }
    }

    document.addEventListener('keydown', keyDownListener)
    actions.startGame()

    return () => document.removeEventListener('keydown', keyDownListener)
  })

  return () => {
    const mode = stateSel.mode

    return (
      <div class="root">
        <Scoreboard />
        <Field>
          <Racket />
          {mode === 'alarm' ? <AlarmPane /> : <Ball />}
          {mode === 'countdown' ? <CountdownPane /> : ''}
        </Field>
      </div>
    )
  }
})

const App = define('x-app', () => {
  useStoreProvider(new GameLogic().getStore())
  useOnMount(() => window.focus())

  return () => <Game />
})

// === styles ========================================================

const styles = {
  game: `
    .root {
      display: inline-block;
      background-color: ${FRONT_COLOR};
      padding: 3px;
      font-size: 16px;
      font-family: 'Courier New', Courier, Helvetica, Arial, sans-serif;
      font-weight: bold;
    }
  `,

  scoreboard: `
    .root {
      height: 20px;
      padding: 4px;
      text-align: center;
    }
  `,

  field: `
    .root {
      position: relative;
      background-color: ${BACK_COLOR}; 
      border: 3px solid ${BACK_COLOR};
      box-sizing: content-box;
    }
  `,

  ball: `
    .root {
      position: absolute;
      background-color: ${BALL_COLOR};
      z-index: 1;
    }
  `,

  racket: `
    .root {
      position: absolute;
      background-color: ${RACKET_COLOR};
      z-index: 2;
    }
  `,

  countdownPane: `
    .root {
      position: absolute;
      padding: ${Math.floor(FIELD_HEIGHT / 5)}px 0 0 0;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      text-align: center;
      font-size: 20px;
      color: white;
      z-index: 3;
    }
  `,

  alertPane: `
    .root {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0.6;
      background-color: red;
      z-index: 4;
    }

    .root.dark {
      opacity: 0.3;
    }
  `
}

// === exports =======================================================

export default App
