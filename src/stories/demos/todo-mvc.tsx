import { component, h, prop } from 'js-elements'
import { useActions, useState, useStore, useSelectors } from 'js-elements/ext'
import { defineMessages } from 'js-messages'
import { createReducer, on } from 'js-reducers'
import { createStore } from 'js-stores'
import { update } from 'js-immutables'
import { createSelector } from 'reselect'

import styles from './styles/todomvc.styles'

// === constants =====================================================

const STORAGE_ID = 'todomvc/js-elements'

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
  loadTodoState: null,
  saveTodoState: null
})

// === reducer =======================================================

const initialTodoState: TodoState = {
  todos: [
    {
      id: 1,
      title: 'Task 1',
      completed: false
    },
    {
      id: 2,
      title: 'Task 2',
      completed: true
    },
    {
      id: 3,
      title: 'Task 3',
      completed: false
    }
  ],

  filter: TodoFilter.All
}

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
  )
])

// === selectors =====================================================

const TodoSel = {
  activeFilter: (state: TodoState) => state.filter,

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

const Item = component('todo-item', {
  props: {
    todo: prop.obj.as<Todo>().req()
  }
})((c, props) => {
  c.addStyles(styles)

  const [state, setState] = useState(c, {
    active: false,
    title: props.todo.title
  })

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
    const classes: string[] = []

    if (state.active) {
      classes.push('editing')
    }

    if (props.todo.completed) {
      classes.push('completed')
    }

    return (
      <li class={classes.join(' ')}>
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

const Main = component('todo-main', (c) => {
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
  const onOpenFilter = (ev: any) => setFilter(TodoFilter.Open, ev)
  const onCompletedFilter = (ev: any) => setFilter(TodoFilter.Completed, ev)
  const onNoFilter = (ev: any) => setFilter(TodoFilter.All, ev)

  const setFilter = (filter: TodoFilter, ev: any) => {
    ev.preventDefault()
    todoAct.setFilter(filter)
  }

  return () => (
    <ul class="filters">
      <li>
        <a
          class={todoSel.activeFilter === TodoFilter.All ? 'selected' : ''}
          onClick={onNoFilter}
          href="#/"
        >
          All
        </a>
      </li>
      <li>
        <a
          class={todoSel.activeFilter === TodoFilter.Open ? 'selected' : ''}
          onClick={onOpenFilter}
          href="#/active"
        >
          Active
        </a>
      </li>
      <li>
        <a
          class={
            todoSel.activeFilter === TodoFilter.Completed ? 'selected' : ''
          }
          onClick={onCompletedFilter}
          href="#/completed"
        >
          Completed
        </a>
      </li>
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
      {todoSel.completedTodos.length > 0 && (
        <button class="clear-completed" onClick={onClearCompleted}>
          Clear completed
        </button>
      )}
    </footer>
  )
})

const TodoMvc = component('todo-mvc', (c) => {
  const store = createStore(todoReducer, initialTodoState)

  store.dispatch(TodoMsg.loadTodoState())
  useStore(c, store)

  store.subscribe(() => {
    console.log('State:', store.getState())
  })

  return () => (
    <div>
      <Header />
      <Main />
      <Footer />
    </div>
  )
})
