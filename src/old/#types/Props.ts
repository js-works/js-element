import VNode from './VNode'

type Props = Record<string, any> & { key?: never, children?: VNode }

export default Props
