import { directive, AttributePart } from 'lit-html'

export default function useElementRef(c) {
  const ref = {
    current: null,

    bind: directive(() => part => {
      const
        committer = part.committer,
        element = committer.element

      if (!(part instanceof AttributePart) || committer.name !== '*ref') {
        throw new Error('Directive "<elementRef>.bind" must only be used on pseudo attribute "*ref"')
      }

      if (ref && typeof ref === 'object') {
        ref.current = element
      }

      c.afterUpdate(() => {
        const root = c.getRoot()
        let elem = ref.current

        if (elem) {
          while (elem && elem !== root) {
            elem = elem.parentNode
          }

          if (elem !== root) {
            ref.current = null
          }
        }
      })
    })()
  }

  return ref
}
