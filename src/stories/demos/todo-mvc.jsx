import { component, getRoot, html, prop, useEffect, useState } from '../../main/index'

const ENTER_KEY = 13
const ESC_KEY = 27

component('todo-header', c => {
  const
    root = getRoot(c),
    [state, setState] = useState(c, { title: '' }),

    onInput = ev => setState({ title: ev.target.value }),

    onKeyDown = ev => {
      if (ev.keyCode === ENTER_KEY && state.title.trim()) {
        const title1 = state.title.trim()

        ev.preventDefault()
        setState({ title: ''})
        ev.target.value = ''

        root.dispatchEvent(
          new CustomEvent('todo.create', {
            bubbles: true,
            detail: { title: title1 }
          })
        )
      }
    }

  return () => html`
    <header class="header">
      <h1>todos</h1>
      <input
        class="new-todo"
        placeholder="What needs to be done?"
        autofocus
        value=${state.title}
        @input=${onInput}
        @keydown=${onKeyDown}
      >
    </header>
  `
})

component('todo-item', {
  props: {
    todo: prop.obj.req()
  }
}, (c, props) => {
  const
    root = getRoot(c),

    [state, setState] = useState(c, {
      active: false,
      title: props.todo.title
    }),

    onToggle = ev => {
      root.dispatchEvent(
        new CustomEvent('todo.toggle', {
          bubbles: true,
          detail: { id: props.todo.id, completed: ev.target.checked },
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

    onDoubleClick = ev => {
      setState({ active: true })
      ev.target.parentElement.nextSibling.focus()
    },

    onInput = ev => {
      setState({ title: ev.target.value })
    },

    onKeyDown = ev => {
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
              detail: { id: props.todo.id },
            }),
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

    return html`
      <li class=${classes.join(' ')}>
        <div class="view">
          <input
            class="toggle"
            type="checkbox"
            ?checked=${props.todo.completed}
            @click=${onToggle}
          >
          <label @dblclick=${onDoubleClick}>
            ${props.todo.title}
          </label>
          <button
            class="destroy"
            @click=${onDestroy}
          >
        </div>
        <input
          class="edit"
          value=${state.title}
          @input=${onInput}
          @keydown=${onKeyDown}
          @blur=${onBlur}
        >
      </li>
    `
  }
})

component('todo-main', {
  props: {
    todos: prop.obj.req(),
    filter: prop.str.req()
  }
}, (c, props) => {
  const
    root = getRoot(c),
    completed = props.todos.every(todo => todo.completed),

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
      ? props.todos.filter(todo => !todo.completed)
      : props.filter === 'completed'
        ? props.todos.filter(todo => todo.completed)
        : props.todos

  return () => html`
    <section class="main">
      <input
        id="toggle-all"
        class="toggle-all"
        type="checkbox"
        @click=${onToggleAll}
        ?checked=${completed}
      >
      <label for="toggle-all">Mark all as complete</label>
      <ul class="todo-list">
        ${filteredTodos.map(todo => html`<todo-item .todo=${todo}></todo-item>`)}
      </ul>
    </section>
  `
})

component('todo-filters', {
  props: {
    filter: prop.str.req()
  }
}, (c, props) => {
  const
    root = getRoot(c),
    onActiveFilter = ev => setFilter('active', ev),
    onCompletedFilter = ev => setFilter('completed', ev),
    onNoFilter = ev => setFilter('', ev),
    
    setFilter = (filter, ev) => {
      ev.preventDefault()
      root.dispatchEvent(
        new CustomEvent('todo.setFilter', {
          bubbles: true,
          detail: { filter }
        }))
    }

  return () => html` 
    <ul class="filters">
      <li>
        <a class=${props.filter === '' ? 'selected' : ''} @click=${onNoFilter} href="#/">
          All
        </a>
      </li>
      <li>
        <a class=${props.filter === 'active' ? 'selected' : ''} @click=${onActiveFilter} href="#/active">
          Active
        </a>
      </li>
      <li>
        <a class=${props.filter === 'completed' ? 'selected' : ''} @click=${onCompletedFilter} href="#/completed">
          Completed
        </a>
      </li>
    </ul>
  `
})

component('todo-footer', {
  props: {
    todos: prop.obj.req(),
    filter: prop.str.req()
  }
}, (c, props) => {
  const
    root = getRoot(c),
    completed = props.todos.filter(todo => todo.completed).length,
    remaining = props.todos.length - completed,

    onClearCompleted = () => 
      root.dispatchEvent(
        new CustomEvent('todo.clearCompleted', { bubbles: true }))

  return () => html`
    <footer class="footer">
      <span class="todo-count">
        <strong>${remaining}</strong> ${remaining === 1 ? 'item' : 'items'} left
      </span>
      <todo-filters filter=${props.filter}></todo-filters>
      ${!completed ? '' : html`<button class="clear-completed" @click=${onClearCompleted}>Clear completed</button>`}
    </footer>
  `
})

component('todo-mvc', c => {
  const
    root = getRoot(c),
    [state, setState] = useState(c, {
      todos: [],
      filter: ''
    })
  
  let nextTodoId = 0

  useEffect(c, () => {
    try {
      const storedTodos = JSON.parse(localStorage.getItem(STORAGE_KEY))

      if (Array.isArray(storedTodos) && storedTodos.length) {
        setState({ todos: storedTodos })
        nextTodoId = Math.max(...storedTodos.map(todo => todo.id)) + 1
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (err) {
      localStorage.removeItem(STORAGE_KEY)
    }

    root.addEventListener('todo.create', ev => {
      const newTodos = [...state.todos]
      newTodos.push({ id: nextTodoId++, title: ev.detail.title, completed: false })
      setState({ todos: newTodos })
      save(state.todos)
    })

    root.addEventListener('todo.edit', ev => {
      const i = state.todos.findIndex(todo => todo.id === ev.detail.id)
      const newTodos = [...state.todos]
      newTodos[i] = { ...newTodos[i], title: ev.detail.title }
      setState({ todos: newTodos })
      save(state.todos)
    })

    root.addEventListener('todo.toggle', ev => {
      const i = state.todos.findIndex(todo => todo.id === ev.detail.id)
      const newTodos = [...state.todos]
      newTodos[i] = { ...state.todos[i], completed: ev.detail.completed }
      setState({ todos: newTodos })
      save(state.todos)
    })

    root.addEventListener('todo.toggleAll', ev => {
      setState({ todos: state.todos.map(todo => ({ ...todo, completed: ev.detail.completed })) })
      save(state.todos)
    })

    root.addEventListener('todo.clearCompleted', () => {
      setState({ todods: state.todos.filter(todo => !todo.completed) })
      save(state.todos)
    })

    root.addEventListener('todo.destroy', ev => {
      setState({ todos: state.todos.filter(todo => todo.id !== ev.detail.id) })
      save(state.todos)
    })

    root.addEventListener('todo.setFilter', ev => {
      setState({ filter: ev.detail.filter })
    })
  }, null)

  return () => {
    let todoBody

    if (state.todos.length > 0) {
      todoBody = html`
        <div>
          <todo-main .todos=${state.todos} filter=${state.filter}></todo-main>
          <todo-footer .todos=${state.todos} filter=${state.filter}></todo-filter>
        </div>
      `
    }
    
    return html`
      <div>
        <todo-header></todo-header>
        ${todoBody}
      </div>
    `
  }
})

const STORAGE_KEY = 'todo-mvc'

function save(todos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
}
