import { defineScreen } from '../types'
import { PipelineScreen } from './PipelineScreen'
import { PIPELINE_FIXED_ZONES, pipelinePropsSchema } from './schema'

export const screen = defineScreen({
  component: PipelineScreen,
  props: pipelinePropsSchema,
  zones: (props) => [
    ...PIPELINE_FIXED_ZONES,
    ...props.stages.flatMap((s) => (s.zone ? [s.zone] : [])),
  ],
})
