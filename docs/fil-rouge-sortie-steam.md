# Fil rouge : la sortie de « Brume » sur Steam (Studio Lanterne)

Scénario `sortie-steam` du Studio Lanterne. Canon général : [fil-rouge-studio.md](fil-rouge-studio.md).
Il suit la vertical slice ([fil-rouge-vertical-slice.md](fil-rouge-vertical-slice.md)) : même
équipe, dix-sept mois plus tard.

## L'histoire en bref

**Jeudi 13 avril 2028**, jour de la sortie de _Brume_ sur Steam, à **19 h 00** (heure de
Paris), au prix de **24,99 €** (−10 % la première semaine). La visite se passe l'après-midi
et le soir : elle montre ce qui a été préparé les semaines précédentes, puis la soirée de
lancement.

L'équipe se souvient de _Petits Cailloux_ (14 mars 2023) : un bug de sauvegarde corrigé
en catastrophe le soir même, une page Steam mise en ligne trop tard. Cette fois, tout est
préparé, et pourtant il y aura une surprise à 19 h 40.

Chiffres clés (fictifs, à reprendre tels quels) :

- **118 400** listes de souhaits la veille de la sortie (objectif d'Ondine : 100 000).
- Version finale (« gold ») : **1.0.0**, validée le **16 mars 2028** ; correctif du premier
  jour : **1.0.1**, publié le 13 avril à **22 h 05**.
- **8 langues** : français, anglais, allemand, espagnol, italien, portugais (Brésil),
  japonais, chinois simplifié.
- Steam Deck : **« Vérifié »** (obtenu le 29 mars), 30 i/s.
- Embargo presse levé le 13 avril à **15 h 00** ; moyenne des tests (agrégateur fictif
  « Score critique ») : **84/100** sur 46 tests.
- Premiers avis des joueurs (à minuit) : **1 260 avis, 92 % positifs** (« Très positives »).
- Ventes des premières 24 h (chiffre de l'écran de fin) : **31 500** exemplaires.

Type (kind) : « Sortie et lancement ». Titre : « Sortir le jeu sur Steam, et tenir le soir
du lancement ». `workItem.project` : `brume`.

## Le parcours (12 étapes) et les postes hors scénario

1. **Victor Lambert, relation éditeur** (poste 15, dans le parcours cette fois) — « La page
   Steam : 118 400 listes de souhaits ». Écran : back-office de la boutique (fictif :
   « Comptoir Steam », vrai outil cité : Steamworks) : courbe des listes de souhaits (pics :
   annonce, salon Lumière Play 2027, démo du festival de démos de février 2028, bande-annonce
   de lancement), statut de la page (« prête »), compte à rebours, prix et remise de
   lancement, embargo presse, clés envoyées aux journalistes et aux créateurs de vidéos (320).
2. **Jeanne Perrin, production** — « Le plan du lancement, heure par heure ». Écran : planning
   (réutiliser `milestone-plan`) : de la version finale du 16 mars au jour J ; la réunion
   « on sort ou pas ? » (go / no-go) du mercredi 12 avril : GO ; le programme du 13 (15 h
   embargo, 18 h 30 tout le monde en war room, 19 h sortie, astreinte jusqu'à 23 h, règle :
   pas de nuit blanche, astreinte tournante le week-end).
3. **Mei Laurent, concept art** — « L'image du jeu, déclinée pour la boutique ». Écran :
   `art-board` : le « key art » (Maëlle et sa lanterne face au phare dans la brume) et ses
   déclinaisons aux formats imposés par la boutique (capsule principale, en-tête, petite
   capsule, bibliothèque) ; la petite capsule doit rester lisible en 184 × 69 px.
4. **Chloé Vasseur, narration** — « Le jeu en 8 langues : quand le texte déborde ». Écran :
   outil de localisation (nouveau, fictif « Fil d'histoire · Traductions ») : 42 000 mots,
   8 langues, une réplique allemande 38 % trop longue pour sa bulle, le japonais vérifié par
   des testeurs natifs, l'humour du gardien adapté plutôt que traduit.
5. **Sarah Cohen, moteur et outils** — « La version finale, envoyée et vérifiée ». Écran :
   `pipeline` (réutilisé) : construction de la 1.0.0, tests automatiques, envoi sur les
   serveurs de Steam (branche « default » privée jusqu'à 19 h), Steam Deck « Vérifié »,
   taille du téléchargement 11,4 Go.
6. **Yasmine Haddou, QA** — « Valve a dit non, puis oui ». Écran : `qa-console` : la revue
   de Valve (premier refus le 20 mars : texte illisible dans une capture d'écran de la
   boutique, et une option manquante pour les manettes ; accord le 24 mars) ; matrice de
   tests sur 12 PC (cartes graphiques, processeurs, Windows 10/11, Steam Deck).
7. **Lucas Ferreira, programmation gameplay** — « Les sauvegardes dans le nuage ». Écran :
   `code-editor` : sauvegarde dans le cloud Steam, avec sauvegarde locale de secours et
   gestion des conflits (le bug de _Petits Cailloux_ venait de là) ; tests.
8. **Romain Delmas, son** — « Entendre la brume, même sans le son ». Écran : `audio-mixer`
   (réutilisé) : options d'accessibilité audio : sous-titres des sons (« [la cloche du
   phare, au loin, à gauche] »), indicateur visuel de direction, mono, réglages séparés
   voix / musique / effets.
9. **Margaux Lefort, direction créative** — « Ce qui part dans le correctif, ce qui attend ».
   Écran : `design-doc` (réutilisé) : le tri de la liste des derniers problèmes : dans la
   1.0.1 (crash, texte allemand), dans la 1.1 de mai (mode photo, nouvelle voix de la brume),
   jamais (« hors piliers »).
10. **Théo Gauthier, technical art** — « 19 h 40 : des plantages sur certaines cartes
    graphiques ». Écran : rapports de plantage (nouveau, fictif « Vigie ») : 214 plantages
    en 40 min, 87 % sur une famille de cartes graphiques avec un ancien pilote, à la
    compilation de l'effet de brume ; correctif (variante simplifiée du shader) testé par
    Yasmine, publié à 22 h 05 en version 1.0.1 ; taux de plantage 3,1 % → 0,2 %.
11. **Karim Belkacem, game design** — « Les premières heures, vues par la télémétrie ».
    Écran : `analytics-dashboard` (réutilisé, généraliser ce qui est propre à Atelier) :
    joueurs simultanés (pic 9 800 à 21 h), progression (73 % ont rallumé le phare de Kerlaz),
    où les joueurs abandonnent (chapitre 3, le marais : réglage prévu en 1.0.2), durée
    moyenne de la première session : 1 h 52.
12. **Elsa Brunet, recherche joueurs** — « 92 % d'avis positifs : écouter les joueurs ».
    Écran : avis des joueurs et de la presse (nouveau, fictif « Labo de jeu · Avis ») :
    1 260 avis à minuit, 92 % positifs, thèmes qui reviennent (ambiance, lanterne,
    « trop court ? », le marais), réponses publiques de l'équipe, presse 84/100 (46 tests),
    citations ; ce qui ira dans la feuille de route de la 1.1.

Hors scénario (bystanders) :

- **Antoine Roux** : prépare le niveau bonus de la mise à jour gratuite 1.1 (mai 2028).
- **Bastien Morel** : le mode photo de la 1.1 (décors retravaillés pour les captures).
- **Aminata Koné** : anime les nouvelles expressions de Maëlle pour le mode photo.

## L'écran de fin

Titre : « Le premier jour de Brume ». Valeurs avant → après :

- Listes de souhaits → exemplaires vendus en 24 h : « 118 400 » → « 31 500 ventes »
- Taux de plantage : « 3,1 % (19 h 40) » → « 0,2 % (1.0.1) »
- Avis des joueurs : « — » → « 92 % positifs (1 260 avis) »
- Note de la presse : « embargo » → « 84/100 »
- Le soir de la sortie : « Petits Cailloux : nuit blanche » → « Brume : astreinte finie à 23 h »

## Mise en scène (staging)

Soirée de lancement : la war room affiche le compte à rebours « Sortie à 19 h 00 » ; une
affiche « Brume · disponible le 13 avril » à l'accueil ou sur le mur de concept art ; les
figurants du playtest (Noah, Lina) ne sont pas là ; Gabriel et Zoé sont à la war room avec
Victor (poste 15, debout au tableau).
