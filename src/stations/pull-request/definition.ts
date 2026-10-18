import { defineScreen } from '../types'
import { PullRequestScreen } from './PullRequestScreen'
import { PULL_REQUEST_ZONES, pullRequestPropsSchema } from './schema'

export const screen = defineScreen({
  component: PullRequestScreen,
  props: pullRequestPropsSchema,
  zones: () => [...PULL_REQUEST_ZONES],
})
