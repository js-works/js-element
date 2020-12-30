import { define, h } from 'js-elements'
import { createStoreHooks, useStyles } from 'js-elements/hooks'
import { defineMessages } from 'js-messages'
import { createReducer, on } from 'js-reducers'
// import { createStore, combineEffects, createEffects, ofType } from 'js-stores'
import { update } from 'js-immutables'

// === constants =====================================================

const FIELD_WIDTH = 400
const FIELD_HEIGHT = 200
const BALL_RADIUS = 5
const BALL_SPEED = 100
const RACKET_WIDTH = 60
const RACKET_HEIGHT = 15
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
    x: 0,
    y: 0
  },

  racket: {
    x: 0,
    y: FIELD_HEIGHT - RACKET_HEIGHT - 10
  },

  score: 0,
  highscore: 0
}

// === state reducer ================================================

const stateReducer = createReducer(initialState, [
  on(
    StateMsg.setBallPos,
    (state, { x, y }) => update(state).set('ball', { x, y }) // TODO
  ),

  on(
    StateMsg.setRacketPos,
    (state, { x, y }) => update(state).set('racket', { x, y }) // TODO
  ),

  on(StateMsg.setScore, (state, { score }) =>
    update(state).set('score', score)
  ),

  on(StateMsg.setHighscore, (state, { highscore }) =>
    update(state).set('highscore', highscore)
  )
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
  })
}

// === effects =======================================================

class Effects {
  //effects = createEffects<AppState>(() => ({}))
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

const [useStore, useSelectors] = createStoreHooks<AppState>()

// === components ====================================================

const Field = define('pogo-field', () => {
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

const Ball = define('pogo-ball', () => {
  const stateSel = useSelectors(StateSel)

  useStyles(styles.ball)

  return () => {
    const style = `
      top: ${stateSel.ballPos.y}px;
      left: ${stateSel.ballPos.x}px;
      width: ${BALL_RADIUS * 2}px;
      height: ${BALL_RADIUS * 2}px;
      border-radius: ${BALL_RADIUS}px;
    `

    return <div class="root" style={style} />
  }
})

const Racket = define('pogo-racket', () => {
  const stateSel = useSelectors(StateSel)

  useStyles(styles.racket)

  const style = `
    top: ${stateSel.racketPos.y}px;
    left: ${stateSel.racketPos.x}px;
    width: ${RACKET_WIDTH}px;
    height: ${RACKET_HEIGHT}px;
  `

  return () => <div class="root" style={style} />
})

const PogoGame = define('pogo-game', () => {
  //const effects = combineEffects(new Effects())
  //const store = createStore(stateReducer, initialState, effects)

  return () => (
    <Field>
      <Ball />
      <Racket />
    </Field>
  )
})

// === styles ========================================================

const styles = {
  game: `
  
  `,

  field: `
    .root {
      position: relative;
      background-color: #ddd;
    }
  `,

  ball: `
    .root {
      background-color: black;
    }
  `,

  racket: `
    .root {
      position: absolute;
      background-color: red;
    }
  `
}

// === exports =======================================================

export default PogoGame
