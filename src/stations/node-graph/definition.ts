import { defineScreen } from '../types'
import { NodeGraphScreen } from './NodeGraphScreen'
import { NODE_GRAPH_ZONES, nodeGraphPropsSchema } from './schema'

export const screen = defineScreen({
  component: NodeGraphScreen,
  props: nodeGraphPropsSchema,
  zones: (props) => [
    ...NODE_GRAPH_ZONES,
    ...new Set(props.nodes.flatMap((n) => (n.zone ? [n.zone] : []))),
  ],
})
