import { component, h, prop } from 'js-elements'
import { useActions, useState, useStore, useSelectors } from 'js-elements/ext'
import { defineMessages } from 'js-messages'
import { createReducer, on } from 'js-reducers'
import { update } from 'js-immutables'

// === constants =====================================================

const ENTER_KEY = 13
const ESC_KEY = 27
const STORAGE_ID = 'todomvc/js-elements'

// === types =========================================================

type Todo = {
  id: number
  title: string
  completed: boolean
}

enum TodoFilter {
  All = '',
  Active = 'active',
  Completed = 'completed'
}

// === messages ======================================================

const TodoMsg = defineMessages('todo', {
  create: (title: string) => ({ title }),
  edit: (id: number, title: string) => ({ id, title }),
  destroy: (id: number) => ({ id }),
  toggle: (id: number, completed: boolean) => ({ id, completed }),
  toggleAll: (completed: boolean) => ({ completed }),
  clearCompleted: null,
  setFilter: (filter: TodoFilter) => ({ filter })
}) as any // TODO!!!!!!!!

// === reducer =======================================================

const initialTodoState = {
  todos: [] as Todo[],
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

// === components ====================================================

const Header = component('todo-header', (c) => {
  const todoAct = useActions(c, TodoMsg)
  const [state, setState] = useState(c, { title: '' })
  const onInput = (ev: any) => setState('title', ev.target.value)

  const onKeyDown = (ev: any) => {
    if (ev.keyCode === ENTER_KEY && state.title.trim()) {
      const title1 = state.title.trim()
      ev.preventDefault()
      setState('title', '')
      ev.target.value = ''
      todoAct.create(title1)
    }
  }

  return () => (
    <header class="header">
      <h1>todos (not working!)</h1>
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
  const todoAct = useActions(c, TodoMsg)

  const [state, setState] = useState(c, {
    active: false,
    title: props.todo.title
  })

  const onToggle = (ev: any) => todoAct.toggle(props.todo.id, ev.target.checked)
  const onDestroy = () => todoAct.destroy(props.todo.id)
  const onInput = (ev: any) => setState({ title: ev.target.value })

  const onDoubleClick = (ev: any) => {
    setState({ active: true })
    ev.target.parentElement.nextSibling.focus()
  }

  const onKeyDown = (ev: any) => {
    if (ev.keyCode === ENTER_KEY || ev.keyCode === ESC_KEY) {
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
    setState({ active: false })

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

const Main = component('todo-main', {
  props: {
    todos: prop.arr.as<Todo[]>().req(),
    filter: prop.str.as<TodoFilter>().req()
  }
})((c, props) => {
  const todoAct = useActions(c, TodoMsg)
  const completed = props.todos.every((todo) => todo.completed)
  const onToggleAll = () => todoAct.toggleAll(!completed)

  let filteredTodos =
    props.filter === TodoFilter.Active
      ? props.todos.filter((todo) => !todo.completed)
      : props.filter === TodoFilter.Completed
      ? props.todos.filter((todo) => todo.completed)
      : props.todos

  return () => (
    <section class="main">
      <input
        id="toggle-all"
        class="toggle-all"
        type="checkbox"
        onClick={onToggleAll}
        checked={completed}
      />
      <label for="toggle-all">Mark all as complete</label>
      <ul class="todo-list">
        {filteredTodos.map((todo) => (
          <Item todo={todo} />
        ))}
      </ul>
    </section>
  )
})

const Filters = component('todo-filters', {
  props: {
    filter: prop.str.as<TodoFilter>().req()
  }
})((c, props) => {
  const todoAct = useActions(c, TodoMsg)
  const onActiveFilter = (ev: any) => setFilter(TodoFilter.Active, ev)
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
          class={props.filter === '' ? 'selected' : ''}
          onClick={onNoFilter}
          href="#/"
        >
          All
        </a>
      </li>
      <li>
        <a
          class={props.filter === 'active' ? 'selected' : ''}
          onClick={onActiveFilter}
          href="#/active"
        >
          Active
        </a>
      </li>
      <li>
        <a
          class={props.filter === 'completed' ? 'selected' : ''}
          onClick={onCompletedFilter}
          href="#/completed"
        >
          Completed
        </a>
      </li>
    </ul>
  )
})

const Footer = component('todo-footer', {
  props: {
    todos: prop.arr.as<Todo[]>().req(),
    filter: prop.str.as<TodoFilter>().req()
  }
})((c, props) => {
  const todoAct = useActions(c, TodoMsg)
  const completed = props.todos.filter((todo: Todo) => todo.completed).length
  const remaining = props.todos.length - completed
  const onClearCompleted = () => todoAct.clearCompleted()

  return () => (
    <footer class="footer">
      <span class="todo-count">
        <strong>${remaining}</strong> ${remaining === 1 ? 'item' : 'items'}
        left
      </span>
      <Filters filter={props.filter} />
      {!completed ? (
        ''
      ) : (
        <button class="clear-completed" onClick={onClearCompleted}>
          Clear completed
        </button>
      )}
    </footer>
  )
})

const TodoMvc = component('todo-mvc', (c) => {
  const [state, setState] = useState(c, {
    todos: [] as Todo[],
    filter: TodoFilter.All
  })

  let nextTodoId = 0

  c.afterMount(() => {
    try {
      const storedTodos = JSON.parse(localStorage.getItem(STORAGE_KEY)!)

      if (Array.isArray(storedTodos) && storedTodos.length) {
        setState({ todos: storedTodos })
        nextTodoId = Math.max(...storedTodos.map((todo) => todo.id)) + 1
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (err) {
      localStorage.removeItem(STORAGE_KEY)
    }
  })

  return () => {
    let todoBody

    if (state.todos.length > 0) {
      todoBody = (
        <div>
          <Main todos={state.todos} filter={state.filter} />
          <Footer todos={state.todos} filter={state.filter} />
        </div>
      )
    }

    return (
      <div>
        <Header />
        {todoBody}
      </div>
    )
  }
})

const STORAGE_KEY = 'todo-mvc'

function save(todos: Todo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
}
