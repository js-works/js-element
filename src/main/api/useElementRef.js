import { directive, AttributePart } from 'lit-html'
import toRef from './toRef'
import hook from './hook'
import globals from '../internal/globals'
export default hook('useElementRef', () => {
  let current = null

  const
    c = globals.currentComponent,
  
    ref = toRef(() => {
      if (c._rendering) {
        throw Error('Property "current" of element refs '
          + 'is not readable while the component is rendering')
      }

      return current
    })

  ref.bind = directive(() => part => {
    const
      committer = part.committer,
      element = committer.element

    if (!(part instanceof AttributePart) || committer.name !== '*ref') {
      throw new Error('Directive "<elementRef>.bind" must only be used on pseudo attribute "*ref"')
    }

    if (ref && typeof ref === 'object') {
      current = element
    }

    c._beforeUpdate(() => {
      current = null
    })
  })()

  return ref
})
