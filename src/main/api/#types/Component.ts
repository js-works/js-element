import Props from './Props'
import VNode from './VNode'

type Component<P extends Props = {}> = (props: P) => VNode

export default Component
