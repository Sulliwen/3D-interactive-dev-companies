import { z } from 'zod'

/**
 * Texte enrichi : `[[id]]` ou `[[id|texte affiché]]` renvoie au glossaire,
 * `**gras**` met en valeur, `` `code` `` affiche un extrait de code.
 */
const richText = z.string().min(1)

const slug = z.string().regex(/^[a-z0-9-]+$/, 'minuscules, chiffres et tirets uniquement')

export const annotationSchema = z.object({
  id: slug,
  /** Zone de l'écran simulé sur laquelle la pastille est posée. */
  zone: z.string().min(1),
  title: z.string().min(1),
  text: richText,
})

export type Annotation = z.infer<typeof annotationSchema>

export const screenSchema = z.object({
  /** Composant d'écran simulé (voir `src/stations/registry.ts`). */
  component: z.string().min(1),
  /** Nom de l'outil fictif affiché dans la barre de titre. */
  toolName: z.string().min(1),
  /** Données propres au composant, validées par son propre schéma. */
  props: z.unknown(),
  annotations: z.array(annotationSchema).min(3).max(6),
})

const handOffSchema = z.object({
  stations: z.array(z.number().int().positive()).min(1),
  text: richText,
})

export const stationDetailsSchema = z.object({
  person: z.object({ firstName: z.string(), lastName: z.string(), role: z.string() }),
  tagline: richText,
  missions: z.array(richText).min(3).max(5),
  takeaways: z.array(richText).length(3),
  myth: z.object({ myth: richText, reality: richText }),
  receivesFrom: handOffSchema,
  handsOffTo: handOffSchema,
  /** Vrais outils du marché, cités en texte seulement. */
  realTools: z.array(z.string()).min(1),
  screen: screenSchema,
})

export type StationDetails = z.infer<typeof stationDetailsSchema>

export const stationSchema = z.object({
  /** Identifiant stable, utilisé pour la progression (ne pas renommer). */
  id: slug,
  /** Position dans le fil rouge ; relie la fiche à l'ancre du poste dans la scène. */
  number: z.number().int().positive(),
  title: z.string().min(1),
  /** Ce qui arrive à la fonctionnalité à cette étape. */
  featureStep: z.string().min(1),
  /** Poste bonus, hors des étapes du fil rouge (ex. Engineering Manager). */
  offPath: z.boolean().default(false),
  /** Fiche complète. Absente tant que le poste n'est pas rédigé (phase 2). */
  details: stationDetailsSchema.optional(),
})

export type Station = z.infer<typeof stationSchema>

export const glossarySchema = z.array(
  z.object({
    id: slug,
    term: z.string().min(1),
    definition: z.string().min(1),
    analogy: z.string().min(1).optional(),
  }),
)

export type GlossaryEntry = z.infer<typeof glossarySchema>[number]

export const companySchema = z.object({
  name: z.string().min(1),
  tagline: z.string().min(1),
  projects: z.array(
    z.object({ id: z.string(), name: z.string(), description: z.string(), featured: z.boolean() }),
  ),
  feature: z.object({ project: z.string(), title: z.string() }),
  /** Résultats de la fonctionnalité, montrés à la fin de la visite. */
  outcomes: z.array(z.object({ label: z.string(), before: z.string(), after: z.string() })),
})

export type Company = z.infer<typeof companySchema>
