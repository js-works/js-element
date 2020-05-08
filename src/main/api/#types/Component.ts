import Props from './Props'
import Methods from './Methods'
import VNode from './VNode'

type Component<P extends Props = {}, M extends Methods = {}> = (props?: P) => VNode // TODO

export default Component
