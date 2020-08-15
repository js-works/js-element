/** @jsx h */
import {
  defineElement,
  getRoot,
  h,
  prop,
  useEffect,
  useState
} from '../../main/index'

const ENTER_KEY = 13
const ESC_KEY = 27

const Header = defineElement('todo-header', (c) => {
  const root = getRoot(c),
    [state, setState] = useState(c, { title: '' }),
    onInput = (ev) => setState({ title: ev.target.value }),
    onKeyDown = (ev) => {
      if (ev.keyCode === ENTER_KEY && state.title.trim()) {
        const title1 = state.title.trim()

        ev.preventDefault()
        setState({ title: '' })
        ev.target.value = ''

        root.dispatchEvent(
          new CustomEvent('todo.create', {
            bubbles: true,
            detail: { title: title1 }
          })
        )
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
        onKleydown={onKeyDown}
      />
    </header>
  )
})

const Item = defineElement({
  name: 'todo-item',

  props: {
    todo: prop(Object).req()
  },

  init(c, props) {
    const root = getRoot(c),
      [state, setState] = useState(c, {
        active: false,
        title: props.todo.title
      }),
      onToggle = (ev) => {
        root.dispatchEvent(
          new CustomEvent('todo.toggle', {
            bubbles: true,
            detail: { id: props.todo.id, completed: ev.target.checked }
          })
        )
      },
      onDestroy = () => {
        root.dispatchEvent(
          new CustomEvent('todo.destroy', {
            bubbles: true,
            detail: { id: props.todo.id }
          })
        )
      },
      onDoubleClick = (ev) => {
        setState({ active: true })
        ev.target.parentElement.nextSibling.focus()
      },
      onInput = (ev) => {
        setState({ title: ev.target.value })
      },
      onKeyDown = (ev) => {
        if (ev.keyCode === ENTER_KEY || ev.keyCode === ESC_KEY) {
          setState({
            active: false,
            title: state.title.trim()
          })

          if (state.title) {
            root.dispatchEvent(
              new CustomEvent('todo.edit', {
                bubbles: true,
                detail: { id: props.todo.id, title: state.title }
              })
            )
          } else {
            root.dispatchEvent(
              new CustomEvent('todo.destroy', {
                bubbles: true,
                detail: { id: props.todo.id }
              })
            )
          }
        }
      },
      onBlur = () => {
        setState({ active: false })

        if (state.title) {
          root.dispatchEvent(
            new CustomEvent('todo.edit', {
              bubbles: true,
              detail: { id: props.todo.id, title: state.title }
            })
          )
        } else {
          root.dispatchEvent(
            new CustomEvent('todo.destroy', {
              bubbles: true,
              detail: { id: props.todo.id }
            })
          )
        }
      }

    return () => {
      const classes = []

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
            <label onDblclick={onDoubleClick}>{props.todo.title}</label>
            <button class="destroy" onClick={onDestroy} />
          </div>
          <input
            class="edit"
            value={state.title}
            onInput={onInput}
            onKeydown={onKeyDown}
            onBlur={onBlur}
          />
        </li>
      )
    }
  }
})

const Main = defineElement({
  name: 'todo-main',

  props: {
    todos: prop(Object).req(),
    filter: prop(String).req()
  },

  init(c, props) {
    const root = getRoot(c),
      completed = props.todos.every((todo) => todo.completed),
      onToggleAll = () => {
        root.dispatchEvent(
          new CustomEvent('todo.toggleAll', {
            bubbles: true,
            detail: { completed: !completed }
          })
        )
      }

    let filteredTodos =
      props.filter === 'active'
        ? props.todos.filter((todo) => !todo.completed)
        : props.filter === 'completed'
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
  }
})

const Filters = defineElement({
  name: 'todo-filters',

  props: {
    filter: prop(String).req()
  },

  init(c, props) {
    const root = getRoot(c),
      onActiveFilter = (ev) => setFilter('active', ev),
      onCompletedFilter = (ev) => setFilter('completed', ev),
      onNoFilter = (ev) => setFilter('', ev),
      setFilter = (filter, ev) => {
        ev.preventDefault()
        root.dispatchEvent(
          new CustomEvent('todo.setFilter', {
            bubbles: true,
            detail: { filter }
          })
        )
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
  }
})

const Footer = defineElement({
  name: 'todo-footer',

  props: {
    todos: prop(Object).req(),
    filter: prop(String).req()
  },

  init(c, props) {
    const root = getRoot(c),
      completed = props.todos.filter((todo) => todo.completed).length,
      remaining = props.todos.length - completed,
      onClearCompleted = () =>
        root.dispatchEvent(
          new CustomEvent('todo.clearCompleted', { bubbles: true })
        )

    return () => (
      <footer class="footer">
        <span class="todo-count">
          <strong>{remaining}</strong> {remaining === 1 ? 'item' : 'items'} left
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
  }
})

const TodoMvc = defineElement('todo-mvc', (c) => {
  const root = getRoot(c),
    [state, setState] = useState(c, {
      todos: [],
      filter: ''
    })

  let nextTodoId = 0

  useEffect(
    c,
    () => {
      try {
        const storedTodos = JSON.parse(localStorage.getItem(STORAGE_KEY))

        if (Array.isArray(storedTodos) && storedTodos.length) {
          setState({ todos: storedTodos })
          nextTodoId = Math.max(...storedTodos.map((todo) => todo.id)) + 1
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      } catch (err) {
        localStorage.removeItem(STORAGE_KEY)
      }

      root.addEventListener('todo.create', (ev) => {
        const newTodos = [...state.todos]
        newTodos.push({
          id: nextTodoId++,
          title: ev.detail.title,
          completed: false
        })
        setState({ todos: newTodos })
        save(state.todos)
      })

      root.addEventListener('todo.edit', (ev) => {
        const i = state.todos.findIndex((todo) => todo.id === ev.detail.id)
        const newTodos = [...state.todos]
        newTodos[i] = { ...newTodos[i], title: ev.detail.title }
        setState({ todos: newTodos })
        save(state.todos)
      })

      root.addEventListener('todo.toggle', (ev) => {
        const i = state.todos.findIndex((todo) => todo.id === ev.detail.id)
        const newTodos = [...state.todos]
        newTodos[i] = { ...state.todos[i], completed: ev.detail.completed }
        setState({ todos: newTodos })
        save(state.todos)
      })

      root.addEventListener('todo.toggleAll', (ev) => {
        setState({
          todos: state.todos.map((todo) => ({
            ...todo,
            completed: ev.detail.completed
          }))
        })
        save(state.todos)
      })

      root.addEventListener('todo.clearCompleted', () => {
        setState({ todods: state.todos.filter((todo) => !todo.completed) })
        save(state.todos)
      })

      root.addEventListener('todo.destroy', (ev) => {
        setState({
          todos: state.todos.filter((todo) => todo.id !== ev.detail.id)
        })
        save(state.todos)
      })

      root.addEventListener('todo.setFilter', (ev) => {
        setState({ filter: ev.detail.filter })
      })
    },
    null
  )

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

function save(todos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
}
