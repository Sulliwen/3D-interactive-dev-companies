import type { ComponentType } from 'react'
import type { z } from 'zod'

export interface ScreenComponentProps {
  /** Nom de l'outil fictif (barre de titre). */
  toolName: string
  /** Données de l'écran, issues de la fiche (validées par le composant). */
  props: unknown
}

/**
 * Un type d'écran simulé : son composant, le schéma de ses données et la liste
 * des zones où une pastille peut se poser (vérifiable sans afficher l'écran).
 */
export interface ScreenDefinition {
  component: ComponentType<ScreenComponentProps>
  props: z.ZodType
  zones: (rawProps: unknown) => string[]
}

export function defineScreen<S extends z.ZodType>(definition: {
  component: ComponentType<ScreenComponentProps>
  props: S
  zones: (props: z.output<S>) => string[]
}): ScreenDefinition {
  return {
    component: definition.component,
    props: definition.props,
    zones: (raw) => definition.zones(definition.props.parse(raw)),
  }
}
