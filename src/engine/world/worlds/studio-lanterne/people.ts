import type { NpcPlacement, StationPerson } from '../../npcs'

/** Les titulaires des postes (bible : docs/fil-rouge-studio.md). */
export const stationPeople: StationPerson[] = [
  { station: 1, id: 'margaux', name: 'Margaux Lefort', role: 'Directrice créative', clip: 'think' },
  { station: 2, id: 'karim', name: 'Karim Belkacem', role: 'Game designer', clip: 'type' },
  { station: 3, id: 'chloe', name: 'Chloé Vasseur', role: 'Scénariste', clip: 'type' },
  { station: 4, id: 'antoine', name: 'Antoine Roux', role: 'Level designer', clip: 'type' },
  { station: 5, id: 'mei', name: 'Mei Laurent', role: 'Concept artist', clip: 'type' },
  { station: 6, id: 'bastien', name: 'Bastien Morel', role: 'Artiste 3D décors', clip: 'type' },
  { station: 7, id: 'aminata', name: 'Aminata Koné', role: 'Animatrice', clip: 'type' },
  { station: 8, id: 'lucas', name: 'Lucas Ferreira', role: 'Programmeur gameplay', clip: 'type' },
  {
    station: 9,
    id: 'sarah',
    name: 'Sarah Cohen',
    role: 'Programmeuse moteur et outils',
    clip: 'think',
  },
  { station: 10, id: 'theo', name: 'Théo Gauthier', role: 'Technical artist', clip: 'type' },
  { station: 11, id: 'romain', name: 'Romain Delmas', role: 'Sound designer', clip: 'type' },
  { station: 12, id: 'jeanne', name: 'Jeanne Perrin', role: 'Producer', clip: 'phone' },
  { station: 13, id: 'yasmine', name: 'Yasmine Haddou', role: 'Testeuse QA', clip: 'type' },
  { station: 14, id: 'elsa', name: 'Elsa Brunet', role: 'Chercheuse playtest', clip: 'type' },
]

/** Figurants par défaut : la relation éditeur à la war room, un playtest, la pause café. */
export const figurants: NpcPlacement[] = [
  {
    id: 'victor',
    name: 'Victor Lambert',
    role: 'Relation éditeur',
    station: 15,
    position: [10.2, -8.7],
    rotationY: Math.PI + 0.35,
    clip: 'talk',
    standing: true,
  },
  {
    id: 'noah',
    name: 'Noah',
    role: 'Joueur de playtest',
    position: [-11.8, -7.95],
    rotationY: -Math.PI / 2,
    clip: 'sit',
    standing: false,
  },
  {
    id: 'lina',
    name: 'Lina',
    role: 'Joueuse de playtest',
    position: [-11.8, -6.85],
    rotationY: -Math.PI / 2,
    clip: 'sit_talk',
    standing: false,
  },
  {
    id: 'gabriel',
    name: 'Gabriel',
    role: 'Pause café',
    position: [10.6, 5.55],
    rotationY: 0.5,
    clip: 'drink',
    standing: true,
  },
  {
    id: 'zoe',
    name: 'Zoé',
    role: 'Pause café',
    position: [11.7, 5.5],
    rotationY: -0.45,
    clip: 'talk',
    standing: true,
  },
]
