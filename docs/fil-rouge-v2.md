# Bible du scénario « Préparer la v2 de Pocket Santé »

Faits communs à tous les écrans et fiches du scénario `preparer-v2`. **Tout chiffre, nom ou
identifiant affiché doit être cohérent avec ce document.** Le modifier ici d'abord, puis
partout. L'entreprise, les personnes et les outils fictifs sont ceux de
[`fil-rouge.md`](fil-rouge.md).

## Le contexte

- **Pocket Santé v1** est en ligne depuis **2023** (3 ans). ~**120 000 patients actifs par
  mois**, ~**96 400 comptes**, ~2 400 praticiens. L'annulation de rendez-vous (1er
  scénario) a été livrée en **novembre 2026**, les rappels SMS en décembre 2026.
- **Pocket Santé 2** : l'application repensée **pour toute la famille** (un foyer, plusieurs
  profils : enfants, parent âgé), avec un nouveau design system (**Lumière 2**) et des
  fondations techniques neuves (API **v2** versionnée, modèle « foyer + profils »).
- **Message clé n° 1 : run et build.** La v1 continue de tourner et d'être maintenue pendant
  toute la construction : **30 % de la capacité** de l'équipe lui est réservée (correctifs,
  sécurité, petites évolutions), **70 %** va à la v2.
- **Message clé n° 2 : reconstruire progressivement, pas tout réécrire d'un coup.** La v2
  est construite à côté de la v1, sur la même base de données, morceau par morceau. Les
  deux applications coexistent ; on passe les patients de l'une à l'autre petit à petit.
- **Message clé n° 3 : une bêta avant de basculer tout le monde.** La visite se termine
  au lancement de la **bêta privée**.

## Le calendrier

- **Mardi 12 janvier 2027** : comité de direction, décision de lancer la v2.
- Janvier : cadrage (data, recherche, architecture, design system). Février → avril :
  construction, sprints 30 à 36.
- **Jour de la visite : jeudi 29 avril 2027**, jour 9 sur 10 du **sprint 36** (lundi 19 →
  vendredi 30 avril). Sprints de la v2 : 30 (25 janv.) à 36 ; sprint 33 : 8 → 19 mars.
  Les 170 premiers comptes (équipe et proches) ont la bêta depuis mardi ; les premières
  familles invitées l'ont ce jeudi.
- Bêta privée : **mai → juin** (objectif **2 100 comptes** fin mai). Bêta ouverte aux
  volontaires : juillet → août. **Bascule générale : septembre 2027.** Arrêt de la v1 :
  **décembre 2027**.

## Le pourquoi (postes Product Manager, Data, Recherche)

- **31 %** des rendez-vous sont pris pour **quelqu'un d'autre** que le titulaire du compte
  (enfant 24 %, parent âgé 7 %), en hausse (26 % il y a un an).
- **21 600 comptes** prennent régulièrement des rendez-vous pour un proche.
- **4 200 comptes en double** : des parents ont créé un second compte, avec une autre
  adresse mail, pour gérer leur enfant.
- Usage des fonctions v1 (part des comptes actifs, mars 2027) : Prendre rendez-vous 100 %,
  Mes rendez-vous 88 %, Rappels SMS 72 %, Annulation 11 %, Documents 6 %, **Messagerie
  cabinet 1,8 %** → abandonnée en v2 (très peu utilisée, coûteuse à maintenir).
- Recherche : **14 entretiens** (10 parents, 4 secrétaires médicales) + **8 tests de
  prototype**. Persona : **Sarah, 34 ans** (la même qu'au 1er scénario), infirmière en
  horaires décalés, deux enfants : **Léo, 6 ans** et **Jade, 3 ans** ; elle prend aussi les
  rendez-vous de sa mère. Citation : « Je gère la santé de toute la famille, mais
  l'application ne connaît que moi. »
- Test du prototype : prendre un rendez-vous pour un enfant passe de **3 min 40** (v1, en
  bricolant le motif) à **1 min 10** ; **7 parents sur 8** y arrivent sans aide.
- OKR 2027 : « Pocket Santé devient l'application de santé de toute la famille ». Résultats
  clés : 2 100 comptes en bêta privée fin mai avec une satisfaction ≥ 4,3 / 5 ; **aucun
  compte perdu** à la migration (répétée 3 fois) ; **aucun incident majeur sur la v1**
  pendant la construction.

## La décision technique (poste Revue de code : Marc)

- **ADR-007** « Reconstruire Pocket Santé 2 pièce par pièce, à côté de la v1 », proposée
  par Marc dans la **pull request #352**, branche `docs/adr-007-architecture-v2`.
- Options étudiées : (A) tout réécrire d'un coup et basculer un soir — refusée (des mois
  sans rien livrer, un seul jour de bascule à très haut risque) ; (B) continuer d'empiler
  sur la v1 — refusée (le modèle « un compte = une personne » est partout) ; **(C) retenue :
  une API v2 versionnée (`/v2/…`) à côté de la v1 (`/v1/…`), même base de données, nouveau
  modèle foyer + profils, nouvelle application derrière l'interrupteur `app-v2-beta`.**
- Relecteurs : Awa ✓, Thomas ✓, Ibrahima ✓, Léa ✓ (après ajout d'une section « données des
  mineurs »). Fusionnée le 21 janvier 2027.

## La préparation (Design, Product Owner, Scrum Master)

- Design system **Lumière 2** (Hugo) : couleurs Santé 600 `#0f8b8d` conservée, Danger 700
  `#b3261e`, nouvelle couleur Famille 500 `#6b5bd2` ; texte minimum 16 px ; zones tactiles
  48 px ; contraste ≥ 4,5 : 1. Premier parcours redessiné : « Mes rendez-vous » (le plus
  utilisé), en partant des écrans v1. Audit v1 : le texte gris des cartes à 3,9 : 1, non
  conforme.
- Épopées (Mathilde) : **PS2-1** Foyer et profils, **PS2-2** Prendre rendez-vous pour un
  proche, **PS2-3** Migration des comptes, **PS2-4** Design system Lumière 2, **PS2-5**
  Bêta privée. Story suivie : **PS2-21** « Prendre rendez-vous pour mon enfant »,
  8 points (estimée le 8 mars, sprint 33). Hors bêta : PS2-9 Carnet de vaccination (idée), messagerie cabinet
  (abandonnée).
- Sprint 36 (Fatou) : objectif « Ouvrir la bêta privée aux premières familles, sans rien
  casser dans la v1 ». Capacité 40 points : 28 v2, 12 v1 (une personne « de garde v1 » par semaine,
  à tour de rôle). Vélocité moyenne : 34 → 40 points depuis l'arrivée de Yanis
  (déc. 2026). Correctif v1 du sprint : **PS-161** « rappel SMS envoyé deux fois » (300
  patients, signalé par Lucie).

## La construction (Back-end, Front-end)

- Back-end (Awa) : routeur `/v2` à côté de `/v1` ; la v1 continue de répondre
  (`/v1/appointments` lit les rendez-vous du profil principal du foyer) ; script
  `migrateAccountsToHouseholds` : chaque compte devient un foyer avec un profil principal,
  les **4 200 doublons** sont rattachés au foyer du parent ; idempotent (relançable sans
  dégât), en mode « essai à blanc » d'abord. Branche `feature/v2-foyers`.
- Front-end (Thomas, avec Yanis) : nouvelle application `pocket-sante-app` v2 derrière
  l'interrupteur `app-v2-beta` ; composant `ProfileSwitcher` (choisir pour qui on prend
  rendez-vous) construit avec les composants Lumière 2. Branche `feature/v2-profils`.

## La vérification (Sécurité, QA)

- Sécurité (Léa) : un parent voit les rendez-vous de ses enfants **mineurs** ; à **18 ans**,
  le profil devient un compte indépendant et le parent perd l'accès ; certains soins d'un
  mineur peuvent rester confidentiels (la loi le permet, par ex. la contraception) : ces
  rendez-vous ne sont jamais visibles du parent ; rattacher un enfant demande une
  **attestation d'autorité parentale** ; modèle de menace : un ex-conjoint qui tenterait
  de rattacher un enfant → validation par le second parent ou le cabinet. Migration : faite
  sur une **copie anonymisée** pour les répétitions.
- QA (Inès) : 468 tests v1 (non-régression) et 1 140 tests v2 ; **répétition de migration
  n° 3** sur une copie anonymisée de **96 400 comptes** : 0 compte perdu (92 200 foyers +
  4 200 profils d'enfants rattachés ; 1 236 400 rendez-vous repris). **BUG-131** (trouvé à
  la répétition n° 2) : après migration, des rendez-vous sont **avancés de deux heures** et
  une annulation est refusée à tort (« moins de 24 h »). Exemple : rendez-vous de Léo lundi
  3 mai à 10:30, affiché 08:30 ; annulation tentée dimanche 2 mai à 9:45 → refusée.
  Cause : la v1 enregistrait déjà les heures en temps universel (UTC) ; le script les
  convertissait une seconde fois depuis l'heure de Paris (−2 h en été). Corrigé par Awa
  (`'Europe/Paris'` → `'UTC'`), retesté. 2 300 rendez-vous concernés.

## Le lancement de la bêta (DevOps)

- Pipeline (Ibrahima) n° **2187** « Pocket Santé 2 · bêta privée », commit `7c41d0b`.
  Étapes : Construction (v1 et v2) → Tests (1 608) → Analyse de sécurité → **Répétition de
  migration** → Recette → Bêta privée.
- Interrupteur `app-v2-beta` : 170 comptes (équipe et proches, mardi 27 avril) → 850
  comptes (premières familles invitées, jeudi 29 avril) → 2 100 comptes (fin mai).
  Retour arrière : la famille revient sur la v1 en un clic, ses rendez-vous restent
  (même base de données).

## Pendant ce temps (hors scénario)

- **Lucie** (support) répond toujours aux patients de la v1 ; elle prépare la FAQ de la
  bêta et sera en première ligne quand les familles écriront.
- **Camille** (supervision) surveille la v1 en production ; la v2 n'est pas encore en
  ligne pour tout le monde.
- **Nadia** (Engineering Manager, poste bonus) : projet long (8 mois) ; risque d'épuisement
  ; recrutement d'un·e développeur·se back-end ; arrivée de **Chloé** le lundi 3 mai.

## Résultats affichés à la fin (au lancement de la bêta)

- Comptes perdus lors de la répétition de migration : 37 (n° 1) → **0** (n° 3).
- Temps pour prendre rendez-vous pour un enfant : 3 min 40 → **1 min 10**.
- Familles avec Pocket Santé 2 : 0 → **850** (2 100 visées fin mai).
- Incidents majeurs sur la v1 pendant la construction : **0**.
