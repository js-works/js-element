import { directive, AttributePart } from 'lit-html'
import toRef from './toRef'

export default function useElementRef(c) {
  let currentElement = null

  const ref = toRef(() => {
    if (c.isRendering()) {
      throw Error('Property "current" of element refs '
        + 'is not readable while the component is rendering')
    }

    return currentElement
  })

  ref.bind = directive(() => part => {
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

  return ref
}
