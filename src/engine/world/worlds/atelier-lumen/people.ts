import { seatedAt, type NpcPlacement, type StationPerson } from '../../npcs'
import { plan } from './plan'

/** Les titulaires des postes : ils restent à leur bureau quel que soit le scénario. */
export const stationPeople: StationPerson[] = [
  { station: 1, id: 'lucie', name: 'Lucie Martin', role: 'Support client', clip: 'type' },
  { station: 2, id: 'samir', name: 'Samir Haddad', role: 'Recherche utilisateur', clip: 'type' },
  { station: 3, id: 'julien', name: 'Julien Moreau', role: 'Data', clip: 'type' },
  { station: 4, id: 'claire', name: 'Claire Dubois', role: 'Product Manager', clip: 'think' },
  { station: 5, id: 'mathilde', name: 'Mathilde Nguyen', role: 'Product Owner', clip: 'type' },
  { station: 6, id: 'hugo', name: 'Hugo Lefèvre', role: 'Designer UX/UI', clip: 'type' },
  { station: 7, id: 'fatou', name: 'Fatou Sow', role: 'Scrum Master', clip: 'stand_type' },
  { station: 8, id: 'awa', name: 'Awa Diallo', role: 'Développeuse back-end', clip: 'type' },
  { station: 9, id: 'thomas', name: 'Thomas Petit', role: 'Développeur front-end', clip: 'type' },
  { station: 10, id: 'marc', name: 'Marc Rousseau', role: 'Développeur senior', clip: 'think' },
  { station: 11, id: 'ines', name: 'Inès Garcia', role: 'QA', clip: 'type' },
  { station: 12, id: 'lea', name: 'Léa Kowalski', role: 'Sécurité', clip: 'type' },
  { station: 13, id: 'ibrahima', name: 'Ibrahima Ndiaye', role: 'DevOps / SRE', clip: 'phone' },
  { station: 14, id: 'camille', name: 'Camille Robert', role: 'Supervision', clip: 'type' },
]

/** Figurants par défaut : café, salle de réunion, mur Scrum. */
export const figurants: NpcPlacement[] = [
  {
    id: 'nadia',
    name: 'Nadia Benali',
    role: 'Engineering Manager',
    station: 15,
    position: [-13.9, -5.5],
    rotationY: Math.PI / 2 + 0.5,
    clip: 'talk',
    standing: true,
  },
  {
    id: 'elise',
    name: 'Élise',
    role: 'En réunion',
    position: seatedAt(plan, 'meeting_chair_4', Math.PI),
    rotationY: Math.PI,
    clip: 'sit_talk',
    standing: false,
  },
  {
    id: 'yanis',
    name: 'Yanis',
    role: 'Pause café',
    position: [-12.4, 7.45],
    rotationY: Math.PI + 0.35,
    clip: 'drink',
    standing: true,
  },
  {
    id: 'sophie',
    name: 'Sophie',
    role: 'Pause café',
    position: [-11.3, 7.6],
    rotationY: Math.PI - 0.6,
    clip: 'talk',
    standing: true,
  },
  {
    id: 'paul',
    name: 'Paul',
    role: 'Au mur Scrum',
    position: [0.9, 0.25],
    rotationY: Math.PI,
    clip: 'point',
    standing: true,
  },
]
