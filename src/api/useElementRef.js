import { directive, AttributePart } from 'lit-html'

export default function useElementRef(c) {
  const root = c.getRoot()
  
  let
    currentElement = null,
    needsCheck = true

  const ref = {
    get current() {
      if (!needsCheck) {
        return currentElement
      }

      let elem = currentElement

      if (elem) {
        while (elem && elem !== root) {
          elem = elem.parentNode
        }

        if (elem !== root) {
          currentElement = null
        }
      }

      needsCheck = false

      return currentElement
    },
    set current(_) {
      throw Error('The propery "current" of element refs is not writable')
    },

    bind: directive(() => part => {
      const
        committer = part.committer,
        element = committer.element

      if (!(part instanceof AttributePart) || committer.name !== '*ref') {
        throw new Error('Directive "<elementRef>.bind" must only be used on pseudo attribute "*ref"')
      }

      if (ref && typeof ref === 'object') {
        currentElement = element
      }

      c.beforeUpdate(() => {
        needsCheck = true
      })
    })()
  }

  return ref
}
