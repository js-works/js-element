import { directive, AttributePart } from 'lit-html'
import toRef from './toRef'
import hook from './hook'
import globals from '../internal/globals'
export default hook('useElementRef', () => {
  let currentElement = null

  const
    c = globals.currentCtrl,
  
    ref = toRef(() => {
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
})
