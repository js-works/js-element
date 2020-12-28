import { component, h, prop } from 'js-elements'
import { createStoreHooks, useActions, useState } from 'js-elements/hooks'
import { defineMessages } from 'js-messages'
import { createReducer, on } from 'js-reducers'
import { combineEffects, createStore, createEffects, ofType } from './js-stores'
import { update } from 'js-immutables'
import classNames from 'classnames'
import styles from './styles/todomvc.styles'
import { filter, map, tap, mapTo } from 'rxjs/operators'

// === constants =====================================================

const STORAGE_KEY = 'todomvc/js-elements'

// === types =========================================================

type Todo = {
  id: number
  title: string
  completed: boolean
}

enum TodoFilter {
  All = 'all',
  Open = 'open',
  Completed = 'completed'
}

type TodoState = {
  todos: Todo[]
  filter: TodoFilter
}

// === messages ======================================================

const TodoMsg = defineMessages('todo', {
  create: (title: string) => ({ title }),
  edit: (id: number, title: string) => ({ id, title }),
  destroy: (id: number) => ({ id }),
  toggle: (id: number, completed: boolean) => ({ id, completed }),
  toggleAll: (completed: boolean) => ({ completed }),
  clearCompleted: null,
  setFilter: (filter: TodoFilter) => ({ filter }),
  setTodoState: (todoState: TodoState) => ({ todoState }),
  loadTodoState: null,
  saveTodoState: null
})

// === state =========================================================

const initialTodoState: TodoState = {
  todos: [],
  filter: TodoFilter.All
}

// === reducer =======================================================

const todoReducer = createReducer(initialTodoState, [
  on(TodoMsg.create, (state, { title }) =>
    update(state, 'todos').push({
      id: state.todos.reduce((max, todo) => Math.max(max, todo.id + 1), 0),
      title,
      completed: false
    })
  ),

  on(TodoMsg.edit, (state, { id, title }) =>
    update(state, 'todos').mapFirst(
      (todo) => todo.id === id,
      (todo) => update(todo).set('title', title)
    )
  ),

  on(TodoMsg.destroy, (state, { id }) =>
    update(state, 'todos').removeFirst((todo) => todo.id === id)
  ),

  on(TodoMsg.toggle, (state, { id, completed }) =>
    update(state, 'todos').mapFirst(
      (todo) => todo.id === id,
      (todo) => update(todo).set('completed', completed)
    )
  ),

  on(TodoMsg.toggleAll, (state, { completed }) =>
    update(state, 'todos').map((todo) =>
      update(todo).set('completed', completed)
    )
  ),

  on(TodoMsg.clearCompleted, (state) =>
    update(state, 'todos').remove((todo) => todo.completed)
  ),

  on(TodoMsg.setFilter, (state, { filter }) =>
    update(state).set('filter', filter)
  ),

  on(TodoMsg.setTodoState, (_, { todoState }) => todoState)
])

// === selectors =====================================================

const TodoSel = {
  filter: (state: TodoState) => state.filter,

  filteredTodos: (state: TodoState) => {
    switch (state.filter) {
      case TodoFilter.Open:
        return state.todos.filter((todo) => !todo.completed)

      case TodoFilter.Completed:
        return state.todos.filter((todo) => todo.completed)

      default:
        return state.todos
    }
  },

  openTodos: (state: TodoState) =>
    state.todos.filter((todo) => !todo.completed),

  completedTodos: (state: TodoState) =>
    state.todos.filter((todo) => todo.completed)
}

// === service interfaces ============================================

interface StorageService {
  save(key: string, value: any): void
  load<T = any>(key: string, defaultValue?: any): T
}

// === service implementations =======================================

class LocalStorageService implements StorageService {
  save(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value))
  }

  load<T = any>(key: string, defaultValue?: T): T {
    let data

    try {
      data = JSON.parse(localStorage.getItem(key)!)
    } catch {}

    return data !== undefined ? data : defaultValue
  }
}

// === effects =======================================================

class TodoEffects {
  constructor(private storageService: StorageService) {}

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
}

// === hooks =========================================================

const [useStore, useSelectors] = createStoreHooks<TodoState>()

// === components ====================================================

const Header = component('todo-header', (c) => {
  c.addStyles(styles)

  const [state, setState] = useState(c, { title: '' })
  const todoAct = useActions(c, TodoMsg)
  const onInput = (ev: any) => setState('title', ev.target.value)

  const onKeyDown = (ev: any) => {
    if (ev.keyCode === 13 && state.title.trim()) {
      const title1 = state.title.trim()
      ev.preventDefault()
      setState('title', '')
      ev.target.value = ''
      todoAct.create(title1)
    }
  }

  return () => (
    <header class="header">
      <h1>todos</h1>
      <input
        class="new-todo"
        placeholder="What needs to be done?"
        autofocus
        value={state.title}
        onInput={onInput}
        onKeyDown={onKeyDown}
      />
    </header>
  )
})

const Item = component('todo-item')({
  props: {
    todo: prop.obj.as<Todo>().req()
  }
})((c, props) => {
  const [state, setState] = useState(c, {
    active: false,
    title: props.todo.title
  })

  c.addStyles(styles)

  const todoAct = useActions(c, TodoMsg)
  const onToggle = (ev: any) => todoAct.toggle(props.todo.id, ev.target.checked)
  const onDestroy = () => todoAct.destroy(props.todo.id)
  const onInput = (ev: any) => setState({ title: ev.target.value })

  const onDoubleClick = (ev: any) => {
    setState({ active: true })
    ev.target.parentElement.nextSibling.focus()
  }

  const onKeyDown = (ev: any) => {
    if (ev.keyCode === 13 || ev.keyCode === 27) {
      setState({
        active: false,
        title: state.title.trim()
      })

      if (state.title) {
        todoAct.edit(props.todo.id, state.title)
      } else {
        todoAct.destroy(props.todo.id)
      }
    }
  }

  const onBlur = () => {
    setState('active', false)

    if (state.title) {
      todoAct.edit(props.todo.id, state.title)
    } else {
      todoAct.destroy(props.todo.id)
    }
  }

  return () => {
    const classes = classNames({
      editing: state.active,
      completed: props.todo.completed
    })

    return (
      <li class={classes}>
        <div class="view">
          <input
            class="toggle"
            type="checkbox"
            checked={props.todo.completed}
            onClick={onToggle}
          />
          <label onDblClick={onDoubleClick}>{props.todo.title}</label>
          <button class="destroy" onClick={onDestroy} />
        </div>
        <input
          class="edit"
          value={state.title}
          onInput={onInput}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
        />
      </li>
    )
  }
})

const Main = component('todo-main')((c) => {
  c.addStyles(styles)

  const todoSel = useSelectors(c, TodoSel)
  const todoAct = useActions(c, TodoMsg)
  const hasCompletedTodos = true // TODO
  const onToggleAll = () => todoAct.toggleAll(!hasCompletedTodos)

  return () => (
    <section class="main">
      <input
        id="toggle-all"
        class="toggle-all"
        type="checkbox"
        onClick={onToggleAll}
        checked={hasCompletedTodos}
      />
      <label for="toggle-all">Mark all as complete</label>
      <ul class="todo-list">
        {todoSel.filteredTodos.map((todo: Todo) => (
          <Item todo={todo} />
        ))}
      </ul>
    </section>
  )
})

const Filters = component('todo-filters', (c) => {
  c.addStyles(styles)

  const todoAct = useActions(c, TodoMsg)
  const todoSel = useSelectors(c, TodoSel)

  function onFilterClick(filter: TodoFilter, ev: any) {
    ev.preventDefault()
    todoAct.setFilter(filter)
  }

  function renderFilter(filter: TodoFilter, path: string, title: string) {
    return (
      <a
        class={todoSel.filter === filter ? 'selected' : ''}
        onClick={(ev: any) => onFilterClick(filter, ev)}
        href={`#/${path}`}
      >
        {title}
      </a>
    )
  }

  return () => (
    <ul class="filters">
      <li>{renderFilter(TodoFilter.All, '', 'All')}</li>
      <li>{renderFilter(TodoFilter.Open, 'active', 'Active')}</li>
      <li>{renderFilter(TodoFilter.Completed, 'completed', 'Completed')}</li>
    </ul>
  )
})

const Footer = component('todo-footer', (c) => {
  c.addStyles(styles)

  const todoAct = useActions(c, TodoMsg)
  const todoSel = useSelectors(c, TodoSel)
  const onClearCompleted = () => todoAct.clearCompleted()

  return () => (
    <footer class="footer">
      <span class="todo-count">
        <strong>{todoSel.openTodos.length} </strong>
        {todoSel.openTodos.length === 1 ? 'item' : 'items'}
        {' left '}
      </span>
      <Filters />
      {todoSel.completedTodos.length === 0 ? (
        ''
      ) : (
        <button class="clear-completed" onClick={onClearCompleted}>
          Clear completed
        </button>
      )}
    </footer>
  )
})

component('todo-mvc', (c) => {
  const rootEffects = combineEffects(new TodoEffects(new LocalStorageService()))
  const store = createStore(todoReducer, initialTodoState, rootEffects)

  store.dispatch(TodoMsg.loadTodoState())
  useStore(c, store)

  return () => (
    <div>
      <Header />
      <Main />
      <Footer />
    </div>
  )
})
