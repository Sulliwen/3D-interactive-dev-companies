import type { Staging } from '../../staging'

/** Mise en scène de chaque scénario du Studio Lanterne (clé : structure/scénario). */
export const staging: Record<string, Staging> = {
  // La vertical slice (jeudi 12 novembre 2026) : le compte à rebours au-dessus du tableau des
  // jalons de la war room, et l'affiche du jalon au dos du mur de concept art (côté îlots).
  // Figurants par défaut : Noah et Lina jouent la slice en salle de playtest.
  'studio-lanterne/vertical-slice': {
    boards: [
      {
        id: 'vs-countdown',
        // Au-dessus du tableau des jalons (qui sert d'écran au poste 15), contre le mur nord.
        position: [11.6, 3.02, -9.885],
        rotationY: 0,
        size: [3, 0.95],
        background: '#f6e7c8',
        title: 'J-22 avant Ondine',
        subtitle: 'Vertical slice · vendredi 4 décembre, à Paris',
        lines: ['Playtest n° 2 : jeudi 26 nov. · Gel du contenu : vendredi 27 nov.'],
      },
      {
        id: 'vs-poster',
        // Au dos du mur de concept art, face aux îlots Design et Art.
        position: [0, 1.45, -1.266],
        rotationY: Math.PI,
        size: [1.7, 1.1],
        background: '#f3ead8',
        title: 'Vertical slice · 4 décembre',
        subtitle: '« Le Phare de Kerlaz » : 15 minutes finies',
        lines: [
          '1. La brume est vivante',
          '2. La lumière coûte quelque chose',
          '3. Chaque lieu garde un souvenir',
          'Pas de crunch : on coupe, on ne veille pas.',
        ],
      },
    ],
  },
}
