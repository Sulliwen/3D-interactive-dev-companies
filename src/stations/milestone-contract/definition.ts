import { defineScreen } from '../types'
import { MilestoneContractScreen } from './MilestoneContractScreen'
import { MILESTONE_CONTRACT_ZONES, milestoneContractPropsSchema } from './schema'

export const screen = defineScreen({
  component: MilestoneContractScreen,
  props: milestoneContractPropsSchema,
  zones: () => [...MILESTONE_CONTRACT_ZONES],
})
