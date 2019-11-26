import { directive, AttributePart } from 'lit-html'

export default function useElementRef(c) {
  let currentElement = null

  const ref = {
    get current() {
      if (c.isRendering()) {
        throw Error('Property "current" of element refs '
          + 'is not readable while the component is rendering')
      }

      return currentElement
    },
    set current(_) {
      throw Error('Property "current" of element refs is not writable')
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
        currentElement = null
      })
    })()
  }

  return ref
}
