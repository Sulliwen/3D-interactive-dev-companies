# Fil rouge : la vertical slice de « Brume » (Studio Lanterne)

Scénario `vertical-slice` du Studio Lanterne. Canon général : [fil-rouge-studio.md](fil-rouge-studio.md).

## L'histoire en bref

**Jeudi 12 novembre 2026.** Dans trois semaines, le **vendredi 4 décembre**, l'équipe présente
à Ondine Publishing, à Paris, la **vertical slice** de _Brume_ : le niveau « Le Phare de
Kerlaz », environ **15 minutes** de jeu **finies comme le jeu final** (graphismes, animations,
son, réglages). Si Hélène Garnier (productrice chez Ondine) est convaincue, Ondine débloque
la suite du financement (**1,8 M€** au total, versés par jalons) et la production complète
démarre. Sinon, le studio n'a pas de quoi payer l'équipe au-delà de mars 2027.

Le travail suivi : **« La séquence du phare » : arriver au village englouti, traverser la
falaise dans la brume, rallumer le phare, entendre la première voix de la brume.** On la
suit d'un poste à l'autre, de la vision à la dernière correction après le playtest.

- Type (kind) : « Jalon de production ». Titre : « Finir 15 minutes du jeu pour convaincre
  l'éditeur » (à affiner).
- `workItem.project` : `brume`.

## Le parcours (14 étapes, tous les postes) et le bonus

Pour chaque étape : la légende de la présentation (`featureStep`, ≤ 70 caractères), l'écran,
et les faits à respecter. Les chiffres sont fictifs mais plausibles ; les reprendre tels quels.

1. **Margaux Lefort, direction créative** — « La vision : ce que la slice doit prouver ».
   Écran : _Carnet de jeu_ (document de vision). Les **trois piliers** de _Brume_ : « La brume
   est vivante », « La lumière coûte quelque chose », « Chaque lieu garde un souvenir ». Ce
   que la slice doit prouver à Ondine : que les trois piliers tiennent ensemble en 15 min.
   Références (films, tableaux, jeux cités en texte). Margaux refuse une idée de combat
   (« hors piliers »).
2. **Jeanne Perrin, production** — « Trois semaines, et ce qu'on coupe pour tenir ».
   Écran : _Tableau des tâches_ (planning du jalon) : 3 sprints d'une semaine jusqu'au
   4 décembre, la **liste des coupes** (la deuxième voix de la brume, la pluie dynamique, le
   bateau jouable → reportés en production), la règle « pas de crunch » (pas de travail le
   soir ni le week-end), le **gel du contenu** le 27 novembre.
3. **Karim Belkacem, game design** — « La lanterne : les règles et les chiffres ».
   Écran : _Carnet de jeu_ (spécification) avec le **tableau de réglages** lu par le code :
   rayon de lumière 6 m, huile 90 s, recharge aux lampes du village, vitesse de la brume
   1,2 m/s, chemin figé pendant 20 s. Changement du jour : huile de 120 s → 90 s (les
   joueurs ne dépensaient jamais leur lumière).
4. **Chloé Vasseur, narration** — « La voix du gardien : un dialogue à embranchements ».
   Écran : _Fil d'histoire_ (graphe de dialogue) : la voix d'Yvon, le gardien disparu ;
   3 réponses possibles de Maëlle, une condition (« a trouvé le carnet du gardien »), un
   souvenir débloqué. 40 répliques, à enregistrer avec une comédienne le 20 novembre.
5. **Mei Laurent, concept art** — « Le phare et la brume, dessinés avant d'être construits ».
   Écran : _Planche_ : peintures du phare de Kerlaz, de la falaise, de la brume (silhouettes,
   **color script** : bleu froid → orange chaud quand le phare se rallume), annotations pour
   Bastien et Aminata.
6. **Antoine Roux, level design** — « Le niveau en blocs gris : chemins et rythme ».
   Écran : _Lanterne Editor_ (vue de dessus et 3D du **blockout**) : chemin critique, 3
   lampes de recharge, la falaise (passage clé), des repères visuels (le phare visible de
   partout). Durée mesurée : 14 min 30 s en moyenne.
7. **Bastien Morel, art 3D décors** — « Du bloc gris au décor final, dans le budget ».
   Écran : _Atelier 3D_ : le phare modélisé, **budget** 25 000 triangles (actuel 23 800),
   3 niveaux de détail (LOD), textures 2048 px, kit modulaire de maisons du village.
8. **Aminata Koné, animation** — « Maëlle lève sa lanterne : l'animation clé ».
   Écran : _Squelette_ (timeline) : clé « lever la lanterne » (1,2 s, 36 images à 30 i/s),
   courbes, anticipation et retombée, transition vers la marche dans la brume.
9. **Lucas Ferreira, programmation gameplay** — « La lumière repousse la brume, en code ».
   Écran : éditeur de code, script C# `LanternLight.cs` (fictif) : lit les réglages de Karim,
   calcule la zone éclairée, fige les chemins. Commentaires en français, code en anglais (règle
   de la Dev Factory).
10. **Théo Gauthier, technical art** — « La brume : un effet qui doit tenir le rythme ».
    Écran : graphe de shader (nœuds) de la brume : bruit animé, profondeur, trou de lumière
    autour de la lanterne ; coût : 2,1 ms par image (budget 2 ms) → il retire un nœud.
11. **Romain Delmas, son** — « La brume qui chuchote : un son qui réagit au jeu ».
    Écran : _Console son_ (intégration) : 4 couches d'ambiance (vent, mer, chuchotements,
    cloche du phare) dont le volume dépend de la **densité de brume** autour de Maëlle ;
    musique de la compositrice extérieure, Lou Ferrand (fictive).
12. **Sarah Cohen, moteur et performances** — « 60 images par seconde, sinon rien ».
    Écran : _Lanterne Editor_ — profileur : budget 16,6 ms par image sur la configuration
    minimale (PC de 2019) ; le pic au rallumage du phare (24 ms) vient du chargement des
    ombres ; après correction : 14,8 ms. Note : **Steam Deck** visé à 30 i/s.
13. **Yasmine Haddou, QA** — « Un bug bloquant dans l'escalier du phare ».
    Écran : _Tableau des tâches_, vue bugs : **BRM-412** « Maëlle reste bloquée dans
    l'escalier si la brume revient pendant la montée » ; étapes pour reproduire, version
    0.7.3, fréquence 3/10, priorité bloquant ; 23 bugs ouverts sur la slice, dont 2 bloquants.
14. **Elsa Brunet, playtest** — « 8 joueurs, et 5 se perdent à la falaise ».
    Écran : _Labo de jeu_ : **carte de chaleur** du niveau (où les joueurs passent, meurent,
    s'arrêtent), 5 joueurs sur 8 perdus à la falaise (le phare caché par la brume), citations,
    durée moyenne 17 min. Correctif décidé avec Antoine et Karim : la cloche du phare sonne
    quand on s'éloigne du chemin. Playtests suivants : 20 novembre (1 joueur sur 8 perdu), 26 novembre (dernier avant le gel
    du contenu). Le premier playtest de la slice a eu lieu le vendredi 6 novembre.

**Bonus — Victor Lambert, relation éditeur** (hors parcours) — « Ce qu'Ondine attend le
4 décembre ». Écran : le **contrat de jalon** : livrables de la vertical slice (version
jouable, vidéo de 2 min, budget mis à jour, planning de production), critères d'acceptation,
**versement de 450 000 €** à la validation ; la date de la démo à la presse (salon fictif au
printemps 2027).

## L'écran de fin

Titre des résultats : « Le 4 décembre, chez Ondine ». Valeurs avant → après :

- Durée de la séquence : « prototype de 4 min » → « 15 min finies »
- Joueurs perdus à la falaise : « 5 sur 8 » → « 1 sur 8 »
- Images par seconde (config. minimale) : « 41 i/s » → « 60 i/s »
- Bugs bloquants : « 2 » → « 0 »
- Décision d'Ondine : « en attente » → « production lancée (1,8 M€) »

## Mise en scène (staging)

- Noah et Lina jouent la slice dans la salle de playtest (figurants par défaut).
- Le tableau des jalons de la war room affiche le compte à rebours « J-22 avant Ondine ».
- Une affiche au mur de concept art : « Vertical slice · 4 décembre ».
