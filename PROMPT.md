# Prompt : « Dev Factory », visite 3D d'un étage d'éditeur de logiciels

## 1. Rôle et objectif

Tu es développeur 3D web senior et concepteur pédagogique. Tu vas construire avec moi une **expérience 3D éducative qui tourne dans le navigateur** : la visite libre d'un étage de bureaux d'une entreprise qui développe des logiciels. Le visiteur se promène, s'approche des postes de travail et découvre, sur l'écran de chaque collaborateur, **en quoi consiste chaque étape de la chaîne de développement**.

Le rendu doit être **le plus réaliste possible** tout en restant fluide sur un PC de bureau modeste. La modélisation, l'assemblage de la scène, le précalcul de l'éclairage et l'animation se font dans **Blender**. Je suis **débutant sur Blender** : guide-moi pas à pas et privilégie des assets existants plutôt que de la modélisation from scratch.

Avant chaque phase, présente ton plan et attends ma validation. Pose des questions quand un choix m'appartient.

## 2. Public cible et ton

- **Public** : des adultes **non techniques** : personnes en reconversion, RH, managers, commerciaux, chefs de projet métier. Ils veulent comprendre comment travaillent les équipes de développement.
- **Ton** : clair, concret et bienveillant, sans condescendance. Chaque terme technique est **expliqué la première fois** qu'il apparaît (infobulle et glossaire global).
- **Analogies** issues du monde du travail non technique : par exemple, la _pull request_ comme « une relecture par un collègue avant envoi » ou le _backlog_ comme « la liste des demandes, triée par priorité ».
- **Pas de code à écrire** pour le visiteur. On **montre** du vrai code, des vrais tickets et des vrais pipelines, avec des annotations qui expliquent ce qu'on regarde.
- Langue : **français**. Tous les textes sont externalisés dans des fichiers de contenu (prêts pour une traduction ultérieure).

## 3. L'entreprise fictive

- **Nom** : _Atelier Lumen_, une scale-up d'environ 25 personnes. Le nom est modifiable, mais il faut garder une marque fictive cohérente partout (logo, mugs, affiches, écrans).
- **Méthode** : **Scrum** avec des sprints de 2 semaines. Cela se voit dans le décor : tableau du sprint physique couvert de post-it, coin du daily debout, salle de sprint review et de rétrospective, calendrier du sprint au mur avec la date du jour.
- **Trois projets en cours**, visibles sur les écrans, les tableaux et les affiches :
  1. **Pocket Santé** : application mobile de prise de rendez-vous médicaux. C'est le **projet fil rouge**.
  2. **Facturo** : logiciel en ligne (SaaS) de facturation pour les artisans. Il sert de décor (tickets, écrans secondaires).
  3. **Refonte du site d'une mutuelle cliente** : prestation pour un client. Elle sert de décor (maquettes au mur, salle de réunion client).

## 4. Le fil rouge pédagogique : suivre une fonctionnalité

Le visiteur suit **une fonctionnalité de Pocket Santé de l'idée jusqu'à la mise en production, puis jusqu'au retour des utilisateurs** :

> **« Permettre au patient d'annuler son rendez-vous et libérer automatiquement le créneau pour d'autres patients. »**

Cette fonctionnalité a été choisie parce qu'elle touche tous les métiers : besoin utilisateur, interface, base de données, notifications, données de santé (sécurité et RGPD), tests, déploiement, statistiques et support.

**Chaque écran montre l'état de cette même fonctionnalité à son étape.** Le visiteur comprend ainsi l'enchaînement des postes. Un **parcours guidé optionnel** est disponible :

- une ligne lumineuse discrète au sol mène au prochain poste ;
- un « carnet de visite » (dans l'interface affichée par-dessus la 3D) indique l'étape N sur 14, les postes déjà vus et le prochain poste.

La **balade reste libre** : on peut visiter les postes dans n'importe quel ordre. Chaque écran rappelle alors « d'où vient » et « où va » la fonctionnalité.

## 5. Les postes (stations interactives)

Il y a une station par métier, dans l'ordre du fil rouge. Pour chaque station, il faut décrire : le métier, ce que l'écran montre, et l'étape de la fonctionnalité qu'on y voit.

| #   | Poste                                                                      | Ce que montre l'écran (outil simulé)                                                                   | Étape de la fonctionnalité                                   |
| --- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| 1   | **Support client**                                                         | Outil de tickets avec des messages de patients (« j'ai pris un RDV par erreur, impossible d'annuler ») | Le besoin émerge des retours des utilisateurs                |
| 2   | **Recherche utilisateur (UX research)**                                    | Synthèse d'entretiens, citations, persona, parcours utilisateur                                        | Le problème est compris et qualifié                          |
| 3   | **Data / analyste**                                                        | Tableau de bord : taux de rendez-vous non honorés, créneaux perdus                                     | Le problème est chiffré (combien de créneaux sont perdus)    |
| 4   | **Product Manager**                                                        | Feuille de route, priorisation (impact / effort), objectif mesurable                                   | On décide de faire la fonctionnalité, et pourquoi maintenant |
| 5   | **Product Owner**                                                          | Backlog, _user story_ avec critères d'acceptation, estimation                                          | La demande devient une tâche claire pour l'équipe            |
| 6   | **Designer UX/UI**                                                         | Outil de maquettage : écrans de l'application, prototype cliquable, composants                         | On dessine l'expérience d'annulation                         |
| 7   | **Scrum Master**                                                           | Tableau du sprint, graphique d'avancement (burndown), notes du daily et de la rétro                    | La fonctionnalité entre dans le sprint                       |
| 8   | **Développeur·se back-end**                                                | Éditeur de code : API d'annulation, requête en base, règle « pas d'annulation à moins de 24 h »        | On construit la logique côté serveur                         |
| 9   | **Développeur·se front-end / mobile**                                      | Éditeur de code et simulateur de téléphone affichant l'écran réel                                      | On construit ce que le patient voit                          |
| 10  | **Revue de code** (sur le poste d'un·e dev senior / _Engineering Manager_) | Pull request : différences de code, commentaires, approbation                                          | Un collègue relit avant que le code soit intégré             |
| 11  | **QA / testeur·se**                                                        | Tests automatisés (vert / rouge), plan de recette manuelle, rapport de bug                             | On vérifie que tout fonctionne et on trouve un bug           |
| 12  | **Sécurité**                                                               | Revue RGPD et données de santé, analyse des dépendances, journal d'accès                               | On vérifie qu'on protège les données des patients            |
| 13  | **DevOps / SRE**                                                           | Pipeline CI/CD (étapes qui s'allument une à une), déploiement progressif                               | La fonctionnalité part en production                         |
| 14  | **Supervision et retour** (poste SRE ou Data)                              | Tableau de supervision en direct, alertes, tableau de bord « créneaux libérés »                        | On mesure l'effet, et la boucle repart vers le support       |

Le **Engineering Manager** apparaît en plus dans la salle de réunion (entretien individuel, recrutement) avec un écran dédié aux aspects humains de l'équipe.

**Contenu attendu pour chaque station** (fichier de données, voir section 9) :

- titre du métier et une phrase d'accroche ;
- « Ce que je fais » : 3 à 5 missions concrètes ;
- **l'écran simulé**, avec 3 à 6 **annotations pédagogiques** cliquables posées sur des zones précises de l'écran ;
- « Ce qu'il faut retenir » : 3 points ;
- « Idée reçue / réalité » : un mythe déconstruit ;
- **liens avec les autres postes** : de qui je reçois le travail, à qui je le transmets ;
- termes du glossaire utilisés.

## 6. Interaction : l'écran zoomable

C'est **le seul mode d'interaction pédagogique**. Il doit être excellent.

1. En s'approchant d'un poste (rayon d'environ 2 m), un indicateur discret apparaît : « [E] Regarder l'écran » (ou un clic sur l'écran).
2. La **caméra quitte l'avatar et vient se placer face à l'écran** par une transition douce d'environ 0,8 s. L'avatar reste en place.
3. L'écran affiche une **interface HTML/React réelle** (et non une image), projetée sur le moniteur 3D grâce au composant `<Html transform occlude>` de drei, ou par rendu dans une texture si les performances l'exigent. Cela permet d'avoir :
   - des onglets, du survol, du défilement, de petites animations (par exemple les étapes de la CI qui passent au vert) ;
   - des **pastilles numérotées** qui ouvrent une bulle d'explication ;
   - un panneau latéral avec la fiche du poste (missions, à retenir, idée reçue, liens).
4. Les outils sont **inspirés des vrais outils** (Jira, Figma, VS Code, GitHub, GitLab CI, Grafana, Zendesk…) sans copier leurs marques ni leurs logos : ils portent des noms fictifs et une identité visuelle propre. La fiche du poste cite les vrais outils du marché, en texte.
5. Une sortie se fait par [Échap], par un bouton « Retour » ou par clic droit, avec une transition inverse vers l'avatar.
6. Hors zoom, les écrans affichent une **version texture statique et légère** du même contenu, pour que l'étage semble vivant à distance.

## 7. Navigation et avatar (3e personne)

- **Avatar humanoïde** riggé, sobre et réaliste (« badge visiteur » autour du cou). Animations : repos, marche, course légère, tourner sur place. Sources possibles : Mixamo, Quaternius ou un personnage rigué d'une banque d'assets.
- **Contrôles** : ZQSD **et** WASD (détection de la disposition du clavier), flèches, souris pour orienter la caméra, Maj pour marcher plus vite. Le **clic au sol pour se déplacer** est proposé en option pour les visiteurs peu habitués aux jeux vidéo, c'est important pour ce public.
- **Caméra orbitale** derrière l'épaule, qui ne traverse pas les murs (lancer de rayon ou sphere-cast) et se rapproche dans les espaces étroits.
- **Collisions** avec murs et mobilier grâce à `@react-three/rapier` (contrôleur de personnage cinématique). L'étude de `ecctrl` comme base est envisageable.
- **Mini-carte** du plateau dans un coin de l'écran, avec la position du visiteur et les postes déjà vus.
- **Écran d'accueil** avec un tutoriel de 20 secondes sur les commandes, et une option « réduire les mouvements de caméra ».

## 8. Le décor : un plateau de startup ou scale-up moderne

Un seul étage d'environ 600 m², lumineux, avec de grandes baies vitrées sur une ville (HDRI ou image de fond en profondeur). L'aménagement comprend :

- **Open space** en îlots de 4 postes, regroupés par équipe : îlot Produit et Design, îlot Dev, îlot QA, Sécurité et DevOps. Les postes Support et Data se trouvent près de l'entrée.
- **Accueil** avec le logo d'Atelier Lumen et un écran de bienvenue (point de départ de la visite).
- **Mur Scrum** : tableau physique avec les colonnes À faire, En cours, En revue, Terminé, et des post-it de couleur par projet. Le post-it « Annulation RDV » s'y trouve.
- **Salle de réunion vitrée** (sprint review et rétrospective), avec écran et paperboard.
- **Cabines téléphoniques**, **coin café et cuisine**, canapés, **plantes**, casiers, imprimante.
- **Détails de vie** qui font le réalisme : mugs, casques audio, carnets, câbles, autocollants sur les ordinateurs portables, écrans doubles, chaises légèrement désalignées, veste sur un dossier, affiches de l'entreprise, plan d'évacuation.
- **Matériaux** : bois clair, béton ciré, moquette acoustique par zones, verre, métal noir mat, panneaux acoustiques au plafond, luminaires suspendus.

## 9. Personnages non-joueurs (PNJ) animés en boucle

- Il y a un collaborateur ou une collaboratrice à chaque station, plus quelques figurants (café, salle de réunion, daily). On vise **la diversité** : genres, âges, origines, tenues, et un collaborateur en fauteuil roulant.
- **Animations en boucle** : taper au clavier, utiliser la souris, réfléchir, téléphoner, boire un café, discuter à deux, montrer un post-it. Sources : Mixamo, réciblées si nécessaire.
- Chaque personnage a un **prénom et un badge**, affichés sur sa fiche et visibles en survol.
- **Réalisme sans vallée de l'étrange** : style réaliste mais légèrement stylisé et cohérent pour tous les personnages, sans gros plan sur les visages.
- **Performances** : niveaux de détail (LOD), mise à jour des animations limitée ou suspendue hors champ et à distance, squelettes partagés, au maximum environ 20 personnages animés visibles à la fois.

## 10. Stack technique

- **Vite + React + TypeScript** (mode strict).
- **Three.js** via **React Three Fiber** et **@react-three/drei**.
- **@react-three/rapier** pour la physique et les collisions.
- **Zustand** pour l'état global : poste actif, progression, réglages.
- **@react-three/postprocessing**, utilisé avec parcimonie : correction de couleurs (tone mapping AgX ou ACES), antialiasing SMAA, léger bloom. **Pas d'occlusion ambiante en temps réel** : elle est précalculée.
- L'interface affichée par-dessus la 3D (carnet, mini-carte, fiches, glossaire) est en React classique, en dehors du canvas.
- **Contenu piloté par les données** : `src/content/stations/*.json` (ou `.ts` typés) pour les stations, `glossary.json` pour le glossaire, `company.json` pour l'entreprise et les projets. Ajouter un poste ne doit demander **aucune modification du code du moteur**.
- **Aucun serveur** : build statique déployable sur GitHub Pages, Netlify ou un intranet. La progression du visiteur est conservée dans `localStorage` (avec gestion d'erreur).
- Qualité du code : ESLint, Prettier, quelques tests Vitest sur la logique (progression, chargement du contenu).

## 11. Pipeline Blender vers le navigateur (pour un débutant)

Rédige un guide **`docs/blender-pipeline.md`** pas à pas, avec captures ou descriptions précises des menus (Blender 4.x). Il couvre :

1. **Blockout** : construire le plan de l'étage avec des boîtes simples aux bonnes dimensions (échelle 1 unité = 1 m), puis l'exporter pour tester la navigation **avant** tout travail artistique.
2. **Récupération d'assets** : Poly Haven (textures PBR, HDRI, quelques meubles), Quaternius et Kenney (mobilier, objets), Sketchfab (filtre CC0 / CC-BY uniquement), Mixamo (personnages et animations). Tous les crédits sont tenus à jour dans **`CREDITS.md`**.
3. **Organisation de la scène** : collections par zone (architecture, mobilier statique, objets interactifs, écrans, personnages), conventions de nommage (`screen_station_05`, `col_wall_*` pour les collisions, `spawn_*` et `anchor_*` pour les points de repère lus par le code).
4. **Éclairage précalculé** (c'est la clé du réalisme sur machine modeste) : deuxième jeu de coordonnées UV pour les lightmaps, précalcul avec Cycles et débruitage, ou bien add-on de précalcul (« The Lightmapper » ou équivalent à jour). Les objets mobiles et les personnages reçoivent un éclairage par sondes ou par carte d'environnement.
5. **Matériaux compatibles glTF** : Principled BSDF uniquement, pas de nœuds procéduraux non exportables.
6. **Export glTF/GLB** avec les bons réglages, puis **optimisation avec `gltf-transform`** : compression Draco ou Meshopt, textures en **KTX2/Basis**, déduplication, regroupement des maillages statiques.
7. **Script Python `bpy`** d'export automatisé (un clic pour tout exporter et optimiser) et script `npm` correspondant.

## 12. Budget de performance (cible : PC de bureau modeste)

- Cible : **60 i/s en 1080p sur une puce graphique intégrée** (Intel Iris Xe ou équivalent), WebGL 2. WebGPU est accepté en bonus seulement.
- Moins de **150 appels de dessin** par image, moins de **500 000 triangles** visibles.
- Téléchargement initial de moins de **30 Mo**, avec un chargement progressif : l'architecture d'abord, les détails et les PNJ ensuite. Un écran de chargement illustré présente l'entreprise.
- Textures de 1K à 2K au maximum, en atlas pour les petits objets, et **instanciation** pour les éléments répétés (chaises, écrans, plantes).
- Un **réglage de qualité** (bas / élevé) est présent dans le menu. Le réglage bas désactive le post-traitement et réduit la résolution de rendu.
- Panneau de statistiques de développement (`r3f-perf`), activable par une touche en mode développement.

## 13. Accessibilité et confort (socle minimal)

- Tout est faisable **au clavier**, avec un focus visible dans l'interface.
- Taille de texte réglable, contraste suffisant (niveau AA) dans les panneaux.
- Option « **réduire les mouvements** » : pas de balancement de caméra, transitions instantanées.
- Le contenu pédagogique est accessible **aussi sans la 3D**, via un menu « Tous les postes » listant les fiches. C'est utile pour le formateur et pour les machines trop faibles.

## 14. Plan de réalisation par phases

Avance **phase par phase**, avec une démo jouable à la fin de chaque phase :

1. **Phase 0 : socle.** Projet Vite, R3F et Rapier ; blockout en boîtes de l'étage (généré dans le code ou exporté de Blender) ; avatar (provisoire) en 3e personne avec collisions et caméra.
2. **Phase 1 : tranche verticale.** **Une seule station complète** (#8, développeur back-end) : écran zoomable, annotations, fiche, glossaire, progression. On valide l'expérience avant de multiplier.
3. **Phase 2 : contenu.** Les 14 stations, avec leurs écrans simulés et leurs textes, ainsi que le parcours guidé et la mini-carte.
4. **Phase 3 : passe artistique dans Blender.** Assets, matériaux, éclairage précalculé, export optimisé, remplacement du blockout.
5. **Phase 4 : PNJ.** Personnages, animations en boucle, LOD et optimisation.
6. **Phase 5 : finitions.** Audio d'ambiance (open space, clavier, machine à café, avec un réglage de volume), écran d'accueil et tutoriel, écran de fin avec récapitulatif de la chaîne complète, passe sur les performances, déploiement statique.

## 15. Livrables

- Le code source organisé, par exemple :
  - `src/engine/` : scène, avatar, caméra, physique ;
  - `src/stations/` : composants des écrans simulés ;
  - `src/ui/` : interface par-dessus la 3D ;
  - `src/content/` : données des stations, du glossaire et de l'entreprise ;
  - `public/models` et `public/textures` : assets 3D.
- `docs/blender-pipeline.md`, `docs/ajouter-une-station.md`, `CREDITS.md`, `README.md` (installation, lancement, déploiement).
- Tous les textes pédagogiques rédigés et relus pour le public non technique.

Commence par me proposer **l'architecture du projet et le plan détaillé de la phase 0**, puis attends ma validation.
