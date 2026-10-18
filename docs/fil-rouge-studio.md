# Bible du Studio Lanterne

Faits communs à tous les écrans, fiches et scénarios du **Studio Lanterne**. **Tout chiffre,
nom ou identifiant affiché doit être cohérent avec ce document.** Le modifier ici d'abord,
puis partout. Les scénarios (la vertical slice, puis la sortie sur Steam) auront chacun leur
bible, qui s'appuiera sur celle-ci.

## Le studio

- **Studio Lanterne** : studio de jeu vidéo **indépendant** (aucun grand groupe derrière),
  **≈ 30 personnes**, à **Bordeaux**, quartier des **Chartrons**. Fondé en **2019** par
  **Margaux Lefort** (direction créative) et **Jeanne Perrin** (production).
- Les locaux : le **rez-de-chaussée d'un ancien entrepôt de vin** réhabilité (briques,
  poutres, grandes verrières d'atelier, plafond à 4 m). Un seul grand plateau.
- Le studio fait des jeux **pour PC**, vendus sur **Steam**. Il vit des ventes de ses jeux et
  de l'argent avancé par son **éditeur** pour le jeu en cours.
- Méthode : production par **jalons** (voir plus bas), et à l'intérieur de chaque jalon des
  **sprints de 2 semaines**. Un **playtest** avec des joueurs extérieurs tous les vendredis
  après-midi.
- Ce que le studio veut montrer au visiteur : **un jeu se fabrique comme un logiciel**
  (code, tests, versions, revues), **mais** avec des métiers en plus (art, animation, son,
  écriture) et une question qu'aucun tableur ne tranche : **« est-ce que c'est amusant ? »**.
  On ne le sait qu'en faisant jouer des gens.

## Les jeux

### Brume (le jeu en cours)

- **Aventure narrative** à la troisième personne, **PC (Steam)**, environ **8 heures** de jeu.
  Sortie visée : **printemps 2028**. Prix visé : **24,99 €**.
- L'histoire : on incarne **Maëlle**, 19 ans, jeune **cartographe**, envoyée cartographier
  **l'île d'Ys-Morvan** (fictive, au large de la Bretagne). Une **brume vivante** a avalé
  l'île : les chemins changent quand on ne les regarde pas.
- La mécanique centrale : **la lanterne**. Sa lumière **repousse la brume** et **fige** les
  chemins révélés ; son huile est limitée. Chaque niveau est une question : où dépenser sa
  lumière ? Mécaniques secondaires : la **carte** que Maëlle dessine elle-même, et les
  **voix** de la brume (des souvenirs d'habitants disparus).
- Le niveau de la vertical slice : **« Le Phare de Kerlaz »**, environ **15 minutes** de jeu :
  arriver au village englouti, rallumer le phare, première rencontre avec une voix de la
  brume.
- Moteur : outil interne **« Lanterne Editor »**, construit par-dessus un moteur du marché
  (le texte cite Unity, Unreal Engine, Godot comme exemples de moteurs ; l'écran n'affiche
  que le nom fictif).
- Budget de production : **2,4 M€**, dont **1,8 M€ avancés par Ondine Publishing**, remboursés
  sur les ventes ; le reste vient des ventes de _Petits Cailloux_ et d'une aide publique
  (fonds d'aide au jeu vidéo, fictif dans le jeu : « Fonds Création Jeu »).

### Petits Cailloux (le jeu précédent)

- **Jeu de réflexion** (puzzle) : un petit robot remet en ordre des jardins japonais.
  Sorti sur **Steam le 14 mars 2023**, **9,99 €**.
- Succès **modeste mais réel** : **≈ 85 000 exemplaires vendus**, **92 % d'avis positifs**
  sur Steam. Il a permis au studio de passer de 12 à 30 personnes.
- Le studio en garde des leçons, citées par l'équipe : un jour de sortie mal préparé (un
  bug de sauvegarde corrigé en catastrophe le soir même), une page Steam mise en ligne trop
  tard (peu de joueurs l'avaient ajoutée à leur liste de souhaits). Matière première du
  futur scénario **« Sortie sur Steam »**.

### Marée basse (prototype)

- Petit **prototype** de deux semaines, fait lors de la **game jam interne** de juillet 2026
  (jeu de pêche à pied coopératif). Pas en production ; il sert d'exemple de prototype vite
  fait, jeté ou gardé selon le plaisir de jeu.

## L'éditeur : Ondine Publishing

- **Ondine Publishing** (fictif, Paris) : éditeur de jeux indépendants. Il **finance** la
  production (avance remboursée sur les ventes), s'occupe du **marketing**, des **salons**,
  de la **localisation** (traductions) et des relations avec les plateformes.
- Contrat : l'argent est versé **par jalon**. Si un jalon n'est pas validé, le versement
  suivant n'arrive pas : c'est pourquoi la vertical slice compte tant.
- Interlocutrice principale chez Ondine : **Hélène Garnier**, productrice chez l'éditeur.
  Côté studio, c'est **Victor Lambert** (poste 15) qui tient la relation au quotidien.

## Les jalons d'un jeu (vocabulaire du studio)

| Jalon                     | Ce que ça veut dire au Studio Lanterne                                               | Brume               |
| ------------------------- | ------------------------------------------------------------------------------------ | ------------------- |
| Concept                   | L'idée, sur quelques pages et des images : le joueur fait quoi, ressent quoi ?       | été 2025            |
| Prototype                 | Une version moche mais jouable de la mécanique centrale : est-ce amusant ?           | automne 2025        |
| Vertical slice            | **Un morceau du jeu fini** (≈ 15 min) à la qualité finale, pour convaincre l'éditeur | **4 décembre 2026** |
| Production                | Fabriquer tout le reste du jeu, niveau par niveau (la plus longue phase)             | 2027                |
| Alpha                     | Tout le jeu est jouable du début à la fin, même si tout n'est pas beau               | septembre 2027      |
| Bêta                      | Plus rien de nouveau : on corrige, on optimise, on peaufine                          | janvier 2028        |
| Gold (version de sortie)  | La version qui sera vendue le jour de la sortie                                      | mars 2028           |
| Sortie et après-lancement | Sortie sur Steam, correctifs, mises à jour, écoute des joueurs                       | printemps 2028      |

## Les personnes (postes 1 à 15)

| Poste | Rôle (identifiant)                             | Personne       | En bref                                                                                                                                  |
| ----- | ---------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Directrice créative (`direction-creative`)     | Margaux Lefort | 41 ans, cofondatrice. Gardienne de la vision : « une île qu'on éclaire pas à pas ». Ancienne game designer dans un grand studio.         |
| 2     | Game designer (`game-design`)                  | Karim Belkacem | 33 ans. Conçoit les règles (la lanterne, l'huile, la brume). Tient le document de game design. Arrivé pour _Petits Cailloux_.            |
| 3     | Scénariste (`narrative-design`)                | Chloé Vasseur  | 30 ans. Écrit l'histoire, les dialogues, les voix de la brume. Ancienne autrice de théâtre. Travaille en duo serré avec Margaux.         |
| 4     | Level designer (`level-design`)                | Antoine Roux   | 29 ans. Dessine les niveaux, d'abord en blocs gris : chemins, rythme, où le joueur se perd. Responsable du niveau « Phare de Kerlaz ».   |
| 5     | Concept artist (`concept-art`)                 | Mei Laurent    | 27 ans. Dessine sur tablette l'île, les personnages, les ambiances, avant que tout soit modélisé en 3D.                                  |
| 6     | Artiste 3D décors (`environment-art`)          | Bastien Morel  | 35 ans. Modélise et texture les décors (rochers, maisons, phare) à partir des concepts de Mei et des blocs d'Antoine.                    |
| 7     | Animatrice (`animation`)                       | Aminata Koné   | 31 ans. Donne vie à Maëlle et aux créatures de la brume : marche, escalade, gestes de la lanterne.                                       |
| 8     | Programmeur gameplay (`gameplay-programming`)  | Lucas Ferreira | 28 ans. Code ce que fait le joueur : déplacements, lanterne, caméra. Travaille chaque jour avec Karim.                                   |
| 9     | Programmeuse moteur et outils (`engine-tools`) | Sarah Cohen    | 38 ans. Fait tourner le jeu vite (performances, chargements) et fabrique les outils de l'équipe dans Lanterne Editor.                    |
| 10    | Technical artist (`technical-art`)             | Théo Gauthier  | 32 ans. Le pont entre artistes et programmeurs : effets de brume (shaders), éclairage, budgets de performance des décors.                |
| 11    | Sound designer (`sound-design`)                | Romain Delmas  | 36 ans. Bruitages, ambiances, voix de la brume ; travaille avec une compositrice extérieure pour la musique. Dans la cabine son.         |
| 12    | Producer (`production`)                        | Jeanne Perrin  | 40 ans, cofondatrice. Planning, budget, priorités, jalons ; protège l'équipe des surcharges (« pas de crunch » est une règle du studio). |
| 13    | Testeuse QA (`qa`)                             | Yasmine Haddou | 26 ans. Joue chaque version pour trouver les bugs, les décrit précisément pour qu'on puisse les reproduire.                              |
| 14    | Chercheuse playtest (`playtest-research`)      | Elsa Brunet    | 34 ans. Organise les playtests du vendredi, observe derrière la vitre, mesure où les joueurs se perdent ou s'ennuient.                   |
| 15    | Relation éditeur (`publishing`, bonus)         | Victor Lambert | 37 ans. Fait le lien avec Ondine Publishing : contrat, jalons, marketing, salons, page Steam. Hors du parcours principal.                |

Relations utiles pour les scénarios :

- **Margaux ↔ Chloé** : la vision et l'histoire ; Margaux tranche quand l'histoire et le jeu
  tirent dans des sens opposés.
- **Karim ↔ Lucas** : la règle et son code ; Karim règle les chiffres (durée de l'huile,
  vitesse de la brume) dans un tableau que le code de Lucas lit directement.
- **Antoine → Bastien → Théo** : du niveau en blocs gris au décor final, puis à la lumière
  et à la brume qui tournent assez vite.
- **Mei → Bastien, Aminata** : les dessins de référence.
- **Sarah** : outils et performances pour tout le monde ; c'est elle qui dit « ça ne tient
  pas à 60 images par seconde ».
- **Yasmine ↔ Elsa** : l'une cherche ce qui est **cassé** (bugs), l'autre ce qui est
  **incompris ou ennuyeux** (expérience de jeu). Elles se complètent.
- **Jeanne ↔ Victor** : le planning interne et les promesses faites à l'éditeur.

Figurants : **Noah** et **Lina** (joueurs de playtest, sur le canapé de la salle de
playtest), **Gabriel** (programmeur, à la pause café), **Zoé** (artiste, à la pause café).

## Les lieux (l'étage)

- **Salle de playtest** (nord-ouest), vitrée côté est par un **miroir sans tain** : canapé,
  grand écran, caméra qui filme les mains et le visage des joueurs (avec leur accord).
  Poste 14 (Elsa) à côté de la vitre.
- **Cabine son** isolée (ouest) : poste 11 (Romain).
- **War room** (salle de réunion vitrée, nord-est) : grande table, **tableau des jalons** ;
  Victor (poste 15) debout au tableau.
- **Mur de concept art** au centre : les dessins de Mei, épinglés, couverts de post-it.
- Trois îlots de bureaux (deux écrans par personne) : **design** (postes 1 à 4), **art**
  (5, 6, 7, 10), **code** (8, 9, 12, 13).
- **Cuisine et coin détente** (sud-est) : canapés, **borne d'arcade** (avec _Petits
  Cailloux_ dessus). **Accueil** au sud, avec les affiches de _Petits Cailloux_ et de _Brume_.

## Les outils fictifs (affichés à l'écran)

Règle commune à toute la Dev Factory : **noms fictifs à l'écran**, vrais outils cités
seulement dans le texte (champ `realTools` des fiches).

| Outil fictif       | Usage                                           | Équivalents réels cités dans les fiches                |
| ------------------ | ----------------------------------------------- | ------------------------------------------------------ |
| Lanterne Editor    | Éditeur du jeu : niveaux, lumière, brume, tests | Unity, Unreal Engine, Godot                            |
| Atelier Code       | Éditeur de code (le même qu'Atelier Lumen)      | Visual Studio, Rider, VS Code                          |
| Carnet de jeu      | Document de game design, partagé                | Confluence, Notion, Google Docs                        |
| Fil d'histoire     | Écriture des dialogues à embranchements         | articy:draft, Ink, Twine, Yarn Spinner                 |
| Planche            | Dessin, peinture numérique                      | Photoshop, Procreate, Krita                            |
| Atelier 3D         | Modélisation, textures                          | Blender, Maya, 3ds Max, Substance Painter, ZBrush      |
| Squelette          | Animation des personnages                       | Maya, MotionBuilder, Blender                           |
| Console son        | Bruitages et intégration du son dans le jeu     | Reaper, Pro Tools, FMOD, Wwise                         |
| Coffre             | Gestion des versions (fichiers lourds compris)  | Perforce, Plastic SCM (Unity Version Control), Git LFS |
| Tableau des tâches | Planning, tâches, bugs                          | Jira, HacknPlan, Trello, Shotgrid                      |
| Labo de jeu        | Playtests : questionnaires, cartes de chaleur   | Google Forms, PlaytestCloud, Lookback, OBS             |

## Le calendrier

- **2019** : fondation du studio par Margaux Lefort et Jeanne Perrin (6 personnes).
- **14 mars 2023** : sortie de _Petits Cailloux_ sur Steam.
- **Été 2025** : concept de _Brume_ ; **automne 2025** : prototype de la lanterne.
- **Janvier 2026** : contrat signé avec **Ondine Publishing**.
- **Juillet 2026** : game jam interne (prototype _Marée basse_).
- **Jeudi 12 novembre 2026** : **jour de la visite** du scénario « vertical slice ».
- **Vendredi 4 décembre 2026** : présentation de la **vertical slice** chez Ondine, à Paris.
- **Printemps 2028** : sortie de _Brume_ visée (futur scénario « Sortie sur Steam »).
