# Bible du scénario « Les débuts d'Atelier Lumen »

Faits communs à tous les écrans et fiches du scénario `debuts`. **Tout chiffre, nom ou
identifiant affiché doit être cohérent avec ce document.** Le modifier ici d'abord, puis
partout. L'entreprise, les personnes et les outils fictifs sont ceux de
[`fil-rouge.md`](fil-rouge.md) ; la suite de l'histoire est dans
[`fil-rouge-v2.md`](fil-rouge-v2.md).

## Le principe

- **Retour en arrière.** Le même étage, mais au **jeudi 4 avril 2024** : Atelier Lumen a
  un an, **cinq personnes**, et n'occupe qu'un coin du plateau. Les dix autres bureaux sont
  vides : leurs titulaires ne sont pas encore arrivés.
- **Message clé n° 1 : au début, une personne = plusieurs métiers.** Claire fait la
  recherche, le produit et la vente ; Hugo le design et le marketing ; Awa tout le
  technique (serveur, base de données, sécurité, mise en ligne). Les autres scénarios
  montrent ces casquettes devenues des métiers.
- **Message clé n° 2 : valider le problème avant de construire.** 30 entretiens, une
  maquette cliquable et une page de destination avant d'écrire la première ligne de code.
- **Message clé n° 3 : des raccourcis assumés, mais pas sur tout.** La première version
  est faite vite, avec des raccourcis écrits noir sur blanc (dette choisie, pas subie). La
  sécurité des données de santé, elle, n'est jamais un raccourci : hébergement **HDS** dès
  le premier jour.

## Le calendrier

- **Mars 2023** : l'idée. Claire Dubois, alors cheffe de projet dans un groupe de cliniques,
  voit les secrétaires médicales passer leurs matinées au téléphone. Elle en parle à Hugo
  Lefèvre (designer) et Awa Diallo (développeuse), deux anciens collègues.
- **Mars → mai 2023** : Claire mène **30 entretiens** (**22 patients**, **8 secrétaires
  médicales**).
- **Juin 2023** : création d'**Atelier Lumen** (SAS, trois cofondateurs, siège à Lyon),
  entrée à l'**incubateur Lyon Santé Numérique** (fictif) : un bureau dans un coin de ce
  plateau, partagé avec d'autres jeunes entreprises.
- **Lundi 12 juin → dimanche 23 juillet 2023** (6 semaines) : maquette cliquable testée par
  Hugo avec **10 patients** (9 prennent un rendez-vous sans aide) et **3 secrétaires** ;
  page de destination **pocketsante.fr** : **3 100 visiteurs**, **412 inscrits** à la bêta
  (13 %), **9 cabinets** volontaires.
- **Lundi 21 août → vendredi 13 octobre 2023** (8 semaines) : Awa code la première
  version (site web adapté au téléphone + espace cabinet), seule.
- **Lundi 2 octobre 2023** : arrivée de **Thomas Petit**, premier développeur recruté.
- **Lundi 6 novembre 2023** : **bêta privée** avec **3 cabinets** (**11 praticiens**) ;
  ~**280 patients** actifs par mois pendant la bêta. Gratuite.
- **Lundi 5 février 2024** : arrivée de **Lucie Martin**, première embauche hors
  technique (ancienne secrétaire médicale) : support, formation et vente.
- **Dimanche 31 mars 2024** : passage à l'heure d'été. La **PR #41** de Thomas (fusionnée
  le jeudi 28 mars) a fait passer toutes les heures en temps universel juste avant.
- **Lundi 1er avril 2024** : les 3 cabinets de la bêta deviennent les **3 premiers clients
  payants** (**29 € par praticien et par mois**).
- **Jour de la visite : jeudi 4 avril 2024**, sortie de l'application mobile sur l'App
  Store et Google Play.
- Ensuite (raconté dans la fin et les bureaux vides) : **levée de fonds de 1,2 M€ en mai
  2024**, puis les recrutements ci-dessous ; 25 personnes en novembre 2026.

## Le parcours (5 étapes, pas de poste bonus)

| #   | Poste (bureau)      | Personne      | Ce qui se passe                                                       |
| --- | ------------------- | ------------- | --------------------------------------------------------------------- |
| 1   | Product Manager (4) | Claire Dubois | Cofondatrice : l'idée et les 30 entretiens de découverte              |
| 2   | Design (6)          | Hugo Lefèvre  | Cofondateur : maquette cliquable et page de destination, 412 inscrits |
| 3   | Back-end (8)        | Awa Diallo    | Cofondatrice : première version en 8 semaines, raccourcis écrits      |
| 4   | Front-end (9)       | Thomas Petit  | Premier recruté : l'appli mobile, et la PR #41 qui consolide          |
| 5   | Support (1)         | Lucie Martin  | Première embauche hors technique : support, formation, vente          |

### 1. Claire : le problème (Carnet UX)

- Étude « Découverte : prendre rendez-vous chez un soignant », mars → mai 2023.
- Problème qualifié : « Pour prendre rendez-vous, il faut appeler aux heures où le cabinet
  est saturé : les patients renoncent ou reportent, et les secrétaires passent jusqu'à
  **3 h par jour** au téléphone. »
- Persona : **Hélène, 41 ans**, commerciale itinérante, deux adolescents. Citation : « Le
  cabinet ouvre quand je suis au volant, et ferme quand je rentre. »
- Ce qui n'a **pas** été retenu : les patients ne demandaient pas de téléconsultation ni de
  dossier médical ; Claire a écarté ces idées.

### 2. Hugo : la preuve d'intérêt (Lumen Insights, statistiques du site)

- Page de destination pocketsante.fr, 12 juin → 23 juillet 2023 : 3 100 visiteurs,
  412 inscrits (13 %), 9 cabinets volontaires. Coût : 0 € de publicité, 180 € de flyers.
- Sources des inscrits : cabinets et proches (bouche-à-oreille) 168, groupes de quartier en ligne 121,
  flyers en salle d'attente 84, LinkedIn 39.
- Maquette cliquable : 9 patients sur 10 prennent un rendez-vous sans aide ; temps médian
  **1 min 50** (contre ~**12 min** au téléphone, attente comprise, selon les entretiens).

### 3. Awa : la première version (Atelier Code)

- Dépôt unique `pocket-sante`, une seule branche `main`, un seul serveur, aucun test
  automatique, déploiement à la main (`./deploy.sh`). Fichier `RACCOURCIS.md` : la liste des
  raccourcis choisis, avec le moment où il faudra les rembourser.
- Raccourcis : (1) les créneaux des cabinets sont saisis à la main dans une page
  d'administration (pas de synchronisation avec leur logiciel d'agenda) ; (2) pas de tests
  automatiques ; (3) déploiement manuel ; (4) un seul serveur ; (5) les rappels sont des
  e-mails, pas des SMS.
- Pas de raccourci : hébergement certifié **HDS**, données chiffrées, accès aux rendez-vous
  limité au patient et à son cabinet.

### 4. Thomas : consolider (Lumen Git)

- Application mobile React Native, construite d'octobre 2023 à mars 2024.
- **PR #41** « Heures des rendez-vous en temps universel + premiers tests automatiques »,
  branche `fix/heures-utc`, auteur Thomas, relue et approuvée par Awa. Fusionnée le jeudi
  28 mars 2024. Le code d'origine enregistrait « 10:30 » en texte, sans fuseau : au passage
  à l'heure d'été, les rappels seraient partis une heure trop tôt. **23 tests**
  automatiques, les premiers du projet. (C'est pourquoi la v1 enregistre ses heures en
  UTC, ce qui jouera un rôle dans le BUG-131 de la v2.)
- La fonction de formatage des créneaux existait en 3 copies : Thomas les remplace par une
  seule (`formatSlot`).

### 5. Lucie : les premiers clients (Lumen Desk)

- Cabinets de la bêta : **Cabinet médical des Pentes** (Lyon 1er, 4 médecins, contact
  Sandrine Moulin, secrétaire), **Centre dentaire Saxe** (Lyon 3e, 3 dentistes, Dr Lambert),
  **Cabinet de kinésithérapie Croix-Rousse** (Lyon 4e, 4 kinés).
- Ticket **T-087** de Sandrine : les congés du Dr Faure (22 → 26 avril) ; l'application ne
  sait pas encore bloquer des congés. Lucie ferme les créneaux à la main et remonte la
  demande à Claire (3e demande « congés » en deux semaines).
- Barre d'état de Lumen Desk : file « Cabinets », première réponse en **25 min** en moyenne,
  satisfaction **non mesurée** (trop peu de clients).
- Demandes depuis le 1er mars : Congés et absences 14, Prise en main de l'agenda 11,
  Demandes de démo 6, Facturation 5, Patients perdus dans l'appli 4.

## Les bureaux vides (arrivées)

| Bureau | Personne        | Arrivée    | Pourquoi à ce moment-là                                    |
| ------ | --------------- | ---------- | ---------------------------------------------------------- |
| 10     | Marc Rousseau   | juin 2024  | Après la levée de fonds : relecture de code systématique   |
| 13     | Ibrahima Ndiaye | sept. 2024 | Fin des déploiements à la main, plusieurs serveurs         |
| 11     | Inès Garcia     | nov. 2024  | 400 cabinets : un bug coûte trop cher pour tester à la fin |
| 5      | Mathilde Nguyen | janv. 2025 | Claire ne peut plus écrire seule toutes les demandes       |
| 2      | Samir Haddad    | mars 2025  | Reprend les entretiens que Claire menait elle-même         |
| 12     | Léa Kowalski    | avril 2025 | Sécurité à plein temps (Awa s'en chargeait)                |
| 3      | Julien Moreau   | juin 2025  | Assez de données pour les analyser                         |
| 7      | Fatou Sow       | sept. 2025 | 15 personnes : passage à Scrum                             |
| 15     | Nadia Benali    | janv. 2026 | Plus de 20 personnes à accompagner                         |
| 14     | Camille Robert  | févr. 2026 | Supervision à plein temps (Ibrahima s'en chargeait)        |

## Résultats affichés à la fin (2024 → novembre 2026)

- Personnes chez Atelier Lumen : 3 (2023) → **25**.
- Praticiens sur Pocket Santé : 11 (3 cabinets) → **2 400**.
- Patients actifs par mois : ≈ 280 (bêta) → **120 000**.
- Tests automatiques : 0 (avant mars 2024) → **412**.
- Organisation : un mur de post-its → **Scrum, sprints de 2 semaines**.
