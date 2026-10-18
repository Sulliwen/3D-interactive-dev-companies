import type { Staging } from '../../staging'
import { seatedAt } from '../../npcs'
import { figurants } from './people'
import { plan } from './plan'

/** Le paperboard de la salle de réunion, vu de face (rotation -0,4 dans le plan). */
const PAPERBOARD = { x: -8, z: -9.2, r: -0.4 }
const facePaperboard = (d: number): [number, number] => [
  PAPERBOARD.x + Math.sin(PAPERBOARD.r) * d,
  PAPERBOARD.z + Math.cos(PAPERBOARD.r) * d,
]

/** Feuille du paperboard, juste devant sa face (épaisseur 10 cm). */
const paperboardFront = facePaperboard(0.056)

/** Mise en scène de chaque scénario d'Atelier Lumen (clé : structure/scénario). */
export const staging: Record<string, Staging> = {
  // Les débuts (avril 2024) : cinq personnes, aucun figurant ; un tableau de post-its en
  // papier devant le mur Scrum, et le point sur la bêta au paperboard.
  'atelier-lumen/debuts': {
    figurants: [],
    boards: [
      {
        id: 'debuts-kanban',
        // Devant la face avant du mur Scrum (côté coin du daily), qu'il recouvre.
        position: [0, 1.15, -0.425],
        rotationY: 0,
        size: [4.3, 1.62],
        background: '#f1ece2',
        title: 'Notre tableau · avril 2024',
        subtitle: 'Un point de dix minutes chaque matin, debout devant les post-its',
        columns: [
          {
            title: 'Idées',
            cards: ['Rappels par SMS', 'Annuler un RDV en ligne ?', 'Lien avec les agendas'],
          },
          {
            title: 'À faire',
            cards: ['Congés des praticiens (Lucie)', 'Le kiné de Joël', 'Facture Centre Saxe'],
          },
          {
            title: 'En cours',
            cards: ['Sortie sur les stores (Thomas)', 'Démo Villeurbanne (Lucie)'],
          },
          {
            title: 'Fait',
            cards: ['PR #41 : heures en UTC', '23 premiers tests', '3 cabinets payants !'],
          },
        ],
      },
      {
        id: 'debuts-beta',
        position: [paperboardFront[0], 1.38, paperboardFront[1]],
        rotationY: PAPERBOARD.r,
        size: [0.72, 0.95],
        background: '#ffffff',
        title: 'Bêta privée : 3 cabinets',
        lines: [
          'Depuis le 6 nov. 2023',
          '11 praticiens · ≈ 280 patients',
          '1er avril : 3 clients payants',
          '29 € / praticien / mois',
          'Aujourd’hui : sortie sur les stores !',
        ],
      },
    ],
  },
  // Préparer la v2 : un atelier v2 dans la salle de réunion, le plan de version au dos du
  // mur Scrum (côté îlot Dev).
  'atelier-lumen/preparer-v2': {
    figurants: [
      figurants.find((f) => f.id === 'nadia')!,
      {
        id: 'paul',
        name: 'Paul',
        role: 'Atelier v2, au paperboard',
        position: facePaperboard(0.95),
        rotationY: Math.PI + PAPERBOARD.r,
        clip: 'point',
        standing: true,
      },
      {
        id: 'elise',
        name: 'Élise',
        role: 'Atelier v2',
        position: seatedAt(plan, 'meeting_chair_4', Math.PI),
        rotationY: Math.PI,
        clip: 'sit_talk',
        standing: false,
      },
      {
        id: 'sophie',
        name: 'Sophie',
        role: 'Atelier v2',
        position: seatedAt(plan, 'meeting_chair_2', 0),
        rotationY: 0,
        clip: 'think',
        standing: false,
      },
      figurants.find((f) => f.id === 'yanis')!,
    ],
    boards: [
      {
        id: 'v2-plan',
        // Au dos du mur Scrum, face à l'îlot Dev.
        position: [0, 1.15, -0.556],
        rotationY: Math.PI,
        size: [4.2, 1.5],
        background: '#f4f6f8',
        title: 'Pocket Santé 2 · plan de version',
        subtitle:
          'La v1 continue pendant ce temps : 12 points par sprint, une personne de garde v1',
        columns: [
          {
            title: 'Janv. · cadrage',
            cards: [
              'ADR-007 : reconstruire pièce par pièce',
              'Lumière 2 : design system',
              '14 entretiens, 8 tests',
            ],
          },
          {
            title: 'Févr. → avr. · sprints 30 à 36',
            cards: [
              'PS2-1 Foyer et profils',
              'PS2-2 RDV pour un proche',
              'PS2-3 Migration (3 répétitions)',
            ],
          },
          {
            title: 'Mai → juin · bêta privée',
            cards: ['170 comptes, puis 850', 'Objectif : 2 100 fin mai', 'Satisfaction ≥ 4,3 / 5'],
          },
          {
            title: 'Sept. 2027 · bascule',
            cards: ['Tout le monde en v2', 'Arrêt de la v1 : déc. 2027'],
          },
        ],
      },
      {
        id: 'v2-atelier',
        position: [paperboardFront[0], 1.38, paperboardFront[1]],
        rotationY: PAPERBOARD.r,
        size: [0.72, 0.95],
        background: '#ffffff',
        title: 'Le foyer de Sarah',
        lines: [
          'Sarah, 34 ans : profil principal',
          'Léo, 6 ans · Jade, 3 ans',
          '+ les RDV de sa mère',
          '« L’appli ne connaît que moi »',
          'RDV enfant : 3 min 40 → 1 min 10',
        ],
      },
    ],
  },
  // Lancer un nouveau produit : deux infirmières pilotes en visite dans la salle de réunion,
  // devant les hypothèses de Tournée écrites sur la vitre ; les citations au paperboard.
  'atelier-lumen/nouveau-produit': {
    figurants: [
      figurants.find((f) => f.id === 'nadia')!,
      {
        id: 'paul',
        name: 'Paul',
        role: 'Démo de Tournée aux infirmières',
        position: [-7.75, -6.3],
        rotationY: Math.PI / 2,
        clip: 'point',
        standing: true,
      },
      {
        id: 'elise',
        name: 'Élise',
        role: 'Infirmière pilote, en visite',
        position: seatedAt(plan, 'meeting_chair_2', Math.PI / 2),
        rotationY: Math.PI / 2,
        clip: 'sit_talk',
        standing: false,
      },
      {
        id: 'sophie',
        name: 'Sophie',
        role: 'Infirmière pilote, en visite',
        position: seatedAt(plan, 'meeting_chair_5', Math.PI / 2),
        rotationY: Math.PI / 2,
        clip: 'think',
        standing: false,
      },
      figurants.find((f) => f.id === 'yanis')!,
    ],
    boards: [
      {
        id: 'tournee-hypotheses',
        // Écrit au feutre sur la cloison vitrée est de la salle, côté intérieur.
        position: [-7.13, 1.45, -7],
        rotationY: -Math.PI / 2,
        size: [2.6, 1.25],
        background: '#f7f8fa',
        title: 'Tournée · nos 4 hypothèses risquées',
        subtitle: 'Comité du 14 mars : ≥ 40 % actives chaque semaine, ≥ 3 cabinets payants',
        columns: [
          {
            title: 'H1 · Le problème',
            cards: ['Les transmissions font perdre du temps', '✓ Validée : 13 / 15'],
          },
          {
            title: 'H2 · L’usage',
            cards: ['Chaque jour, même sans réseau', '✓ Validée : 9 / 20'],
          },
          {
            title: 'H3 · L’itinéraire',
            cards: ['Elles veulent un trajet calculé', '✗ Invalidée : 5 / 6 l’ignorent'],
          },
          {
            title: 'H4 · Le paiement',
            cards: ['19 € / mois / infirmière', '✓ 3 cabinets ont signé'],
          },
        ],
      },
      {
        id: 'tournee-entretiens',
        position: [paperboardFront[0], 1.38, paperboardFront[1]],
        rotationY: PAPERBOARD.r,
        size: [0.72, 0.95],
        background: '#ffffff',
        title: 'Entendu en tournée',
        lines: [
          '« 40 min de SMS chaque soir »',
          '« Le cahier est dans ma voiture »',
          '« Pas de réseau une maison sur deux »',
          '« L’insuline de 7 h, c’est 7 h »',
          '15 entretiens · 3 tournées',
        ],
      },
    ],
  },
}
