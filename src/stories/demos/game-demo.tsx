import { define, h } from 'js-elements'
import { defineMessages } from 'js-messages'
import { createReducer, when } from 'js-reducers'
import { filter, map, tap } from 'rxjs/operators'

import {
  createStoreHooks,
  useActions,
  useOnMount,
  useStyles
} from 'js-elements/hooks'

import {
  createStore,
  combineEffects,
  createEffects,
  done,
  ofType
} from '../libs/js-stores'

import { update } from 'js-immutables'

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

// === types =========================================================

type AppState = {
  ball: { x: number; y: number }
  racket: { x: number; y: number }
  score: number
  highscore: number
}

// === messages ======================================================

const StateMsg = defineMessages({
  setBallPos: (x: number, y: number) => ({ x, y }),
  setRacketPos: (x: number, y: number) => ({ x, y }),
  setScore: (score: number) => ({ score }),
  setHighscore: (highscore: number) => ({ highscore })
})

const ActionMsg = defineMessages({
  tick: null,
  moveRacketLeft: null,
  moveRacketRight: null
})

// === initial app state =============================================

const initialState: AppState = {
  ball: {
    x: 10,
    y: 10
  },

  racket: {
    x: 20,
    y: FIELD_HEIGHT - RACKET_HEIGHT
  },

  score: 0,
  highscore: 0
}

// === state reducer ================================================

const stateReducer = createReducer(initialState, [
  when(StateMsg.setBallPos, (state, { x, y }) => {
    state.ball.x = x
    state.ball.y = y
  }),

  when(StateMsg.setRacketPos, (state, { x, y }) => {
    state.racket.x = x
    state.racket.y = y
  }),

  when(StateMsg.setScore, (state, { score }) => {
    state.score = score
  }),

  when(StateMsg.setHighscore, (state, { highscore }) => {
    state.highscore = highscore
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
  })
}

// === effects =======================================================

class Effects {
  effects = createEffects<AppState>((msg$, state$, getState) => ({
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
  /*
  effects = createEffects<TodoState>((msg$, state$, getState) => ({
    onStateChange: state$.pipe(mapTo(TodoMsg.saveTodoState)),

    saveToStorage: msg$.pipe(
      ofType(TodoMsg.saveTodoState),
      tap(() => this.storageService.save(STORAGE_KEY, getState())),
      filter(() => false)
    ),

    loadFromStorage: msg$.pipe(
      ofType(TodoMsg.loadTodoState),
      map(() => this.storageService.load(STORAGE_KEY, initialTodoState)),
      map((state: TodoState) => TodoMsg.setTodoState(state))
    )
  }))
  */
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

const Game = define('x-game', () => {
  useStyles(styles.game)
  const actions = useActions(ActionMsg)

  useOnMount(() => {
    const keyDownListener = (ev: any) => {
      if (ev.keyCode === 37) {
        actions.moveRacketLeft()
      } else if (ev.keyCode === 39) {
        actions.moveRacketRight()
      }
    }

    document.addEventListener('keydown', keyDownListener)

    return () => document.removeEventListener('keydown', keyDownListener)
  })

  return () => (
    <div class="root">
      <Scoreboard />
      <Field>
        <Ball />
        <Racket />
      </Field>
    </div>
  )
})

const App = define('x-app', () => {
  const effects = combineEffects(new Effects())
  const store = createStore(stateReducer, initialState, effects)

  useStoreProvider(store)

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
      background-color: ${BALL_COLOR};
    }
  `,

  racket: `
    .root {
      position: absolute;
      background-color: ${RACKET_COLOR};
    }
  `
}

// === exports =======================================================

export default App
