import { defineScreen } from '../types'
import { LocalizationScreen } from './LocalizationScreen'
import { LOCALIZATION_ZONES, localizationPropsSchema } from './schema'

export const screen = defineScreen({
  component: LocalizationScreen,
  props: localizationPropsSchema,
  zones: (props) => {
    if (!props.table.rows.some((r) => r.id === props.bubble.rowId)) {
      throw new Error(`Aperçu : ligne « ${props.bubble.rowId} » absente de la table`)
    }
    return [...LOCALIZATION_ZONES]
  },
})
