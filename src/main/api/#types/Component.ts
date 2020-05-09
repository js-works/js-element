import Props from './Props'
import Methods from './Methods'
import Key from './Key'
import VNode from './VNode'

type Component<P extends Props = {}, M extends Methods = {}> = (props?: P & { key?: Key }) => VNode // TODO

export default Component
