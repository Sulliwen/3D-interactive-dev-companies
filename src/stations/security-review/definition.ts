import { defineScreen } from '../types'
import { SecurityReviewScreen } from './SecurityReviewScreen'
import { SECURITY_REVIEW_FIXED_ZONES, securityReviewPropsSchema } from './schema'

export const screen = defineScreen({
  component: SecurityReviewScreen,
  props: securityReviewPropsSchema,
  zones: (props) => [...SECURITY_REVIEW_FIXED_ZONES, ...props.checklist.map((g) => g.zone)],
})
