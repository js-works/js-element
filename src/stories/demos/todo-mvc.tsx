/*
import { component, h, prop } from '../../main/js-elements'
import { useState } from '../../main/js-elements-ext'

const ENTER_KEY = 13
const ESC_KEY = 27

const Header = component('todo-header', (c) => {
  const root = c.getContentElement()
  const [state, setState] = useState(c, { title: '' })
  const onInput = (ev: any) => setState({ title: ev.target.value })

  const onKeyDown = (ev: any) => {
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
        onKeyDown={onKeyDown}
      />
    </header>
  )
})

const Item = component('todo-item', {
  props: {
    todo: prop.obj.req()
  },

  main(c, props) {
    const root = c.getContentElement()
    const [state, setState] = c.addState({
      active: false,
      title: props.todo.title
    })

    const onToggle = (ev: any) => {
      root.dispatchEvent(
        new CustomEvent('todo.toggle', {
          bubbles: true,
          detail: { id: props.todo.id, completed: ev.target.checked }
        })
      )
    }

    const onDestroy = () => {
      root.dispatchEvent(
        new CustomEvent('todo.destroy', {
          bubbles: true,
          detail: { id: props.todo.id }
        })
      )
    }

    const onDoubleClick = (ev: any) => {
      setState({ active: true })
      ev.target.parentElement.nextSibling.focus()
    }

    const onInput = (ev: any) => setState({ title: ev.target.value })

    const onKeyDown = (ev: any) => {
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
    }

    const onBlur = () => {
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
            <label onDblClick={onDoubleClick}>{props.todo.title}</label>
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

const Main = component('todo-main', {
  props: {
    todos: prop.obj.req(),
    filter: prop.str.req()
  },

  main(c, props) {
    const root = c.getContentElement()
    const completed = props.todos.every((todo) => todo.completed)

    const onToggleAll = () => {
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
          $
          {filteredTodos.map((todo) => (
            <Item todo={todo} />
          ))}
        </ul>
      </section>
    )
  }
})

const Filters = component('todo-filters', {
  props: {
    filter: prop.str.req()
  },

  main(c, props) {
    const root = c.getContentElement()
    const onActiveFilter = (ev: any) => setFilter('active', ev)
    const onCompletedFilter = (ev: any) => setFilter('completed', ev)
    const onNoFilter = (ev: any) => setFilter('', ev)

    const setFilter = (filter, ev) => {
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

const Footer = component('todo-footer', {
  props: {
    todos: prop.obj.req(),
    filter: prop.str.req()
  },

  main(c, props) {
    const root = c.getContentElement()
    const completed = props.todos.filter((todo) => todo.completed).length
    const remaining = props.todos.length - completed

    const onClearCompleted = () =>
      root.dispatchEvent(
        new CustomEvent('todo.clearCompleted', { bubbles: true })
      )

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
  }
})

const TodoMvc = component('todo-mvc', (c) => {
  const root = c.getContentElement(),
    [state, setState] = c.addState({
      todos: [],
      filter: ''
    })

  let nextTodoId = 0

  c.effect(() => {
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

    root.addEventListener('todo.create', (ev: any) => {
      const newTodos = [...state.todos]
      newTodos.push({
        id: nextTodoId++,
        title: ev.detail.title,
        completed: false
      })
      setState({ todos: newTodos })
      save(state.todos)
    })

    root.addEventListener('todo.edit', (ev: any) => {
      const i = state.todos.findIndex((todo) => todo.id === ev.detail.id)
      const newTodos = [...state.todos]
      newTodos[i] = { ...newTodos[i], title: ev.detail.title }
      setState({ todos: newTodos })
      save(state.todos)
    })

    root.addEventListener('todo.toggle', (ev: any) => {
      const i = state.todos.findIndex((todo) => todo.id === ev.detail.id)
      const newTodos = [...state.todos]
      newTodos[i] = { ...state.todos[i], completed: ev.detail.completed }
      setState({ todos: newTodos })
      save(state.todos)
    })

    root.addEventListener('todo.toggleAll', (ev: any) => {
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

    root.addEventListener('todo.destroy', (ev: any) => {
      setState({
        todos: state.todos.filter((todo) => todo.id !== ev.detail.id)
      })
      save(state.todos)
    })

    root.addEventListener('todo.setFilter', (ev: any) => {
      setState({ filter: ev.detail.filter })
    })
  }, null)

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
*/
