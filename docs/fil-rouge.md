# Bible du fil rouge

Faits communs à tous les écrans et fiches. **Tout chiffre, nom ou identifiant affiché
quelque part doit être cohérent avec ce document.** Le modifier ici d'abord, puis partout.

## L'entreprise et le produit

- **Atelier Lumen** : scale-up lyonnaise d'environ 25 personnes, Scrum, sprints de 2 semaines.
- **Pocket Santé** (projet fil rouge) : application mobile de prise de rendez-vous médicaux.
  ~120 000 patients actifs par mois, ~2 400 praticiens (médecins, dentistes, kinés…).
- Projets de décor : **Facturo** (facturation en ligne pour artisans) et la **refonte du
  site de la Mutuelle Horizon** (client).
- Couleurs par projet dans les outils : Pocket Santé = série 1 (bleu), Facturo = série 2
  (orange), Mutuelle = série 3 (vert d'eau).

## La fonctionnalité suivie

> « Permettre au patient d'annuler son rendez-vous et libérer automatiquement le créneau
> pour d'autres patients. »

### Le problème (postes 1 à 3)

- Aujourd'hui, l'application ne permet **pas** d'annuler : il faut appeler le cabinet.
  Beaucoup de patients ne le font pas et ne viennent simplement pas.
- **18 %** des rendez-vous ne sont pas honorés (« rendez-vous non honorés », dits « lapins »).
- Environ **3 100 créneaux perdus par mois** sur la plateforme.
- Support : **214 tickets** « annulation » le mois dernier, **1er motif de contact**.
  Ticket emblématique : **#4521**, Sophie L. : « J'ai pris un rendez-vous par erreur, je ne
  trouve pas comment l'annuler. Le cabinet ne répond pas. »
- Recherche utilisateur : **12 entretiens** (8 patients, 4 secrétaires médicales).
  Persona : **Sarah, 34 ans**, infirmière en horaires décalés, deux enfants, prend ses
  rendez-vous le soir sur son téléphone. Citation clé : « Je ne veux pas bloquer la place
  de quelqu'un, mais appeler à 8 h, c'est impossible pour moi. »

- Data : ~**17 200 rendez-vous par mois** sur la plateforme ; la spécialité la plus touchée
  est la médecine générale (**1 240 créneaux perdus** en octobre). Hypothèse : si 30 % des
  patients prévenaient, **≈ 930 créneaux par mois** seraient récupérés.

### La décision et la préparation (postes 4 à 7)

- Objectif (Product Manager, OKR du trimestre) : **réduire de 30 % les créneaux perdus en
  3 mois**. Indicateur principal : créneaux libérés **et repris** par un autre patient.
- Décision prise en **comité produit le 21 octobre 2026**. Résultats clés de l'OKR :
  3 100 → 2 170 créneaux perdus par mois ; la moitié des créneaux libérés repris ; tickets
  « annulation » divisés par deux.
- Feuille de route : Annulation (nov.), Rappels SMS la veille (déc.), Paiement en ligne
  (janv.–févr.), Téléconsultation (mars–avr.).
- Priorisation impact / effort : impact fort, effort moyen → **priorité n° 1 du trimestre**
  (devant « Paiement en ligne » et « Téléconsultation »).
- User story **PS-142** : « En tant que patient, je veux annuler mon rendez-vous depuis
  l'application, afin de libérer ma place pour quelqu'un d'autre. » Estimation **5 points**.
- Critères d'acceptation :
  1. le patient peut annuler en ligne un rendez-vous prévu **dans 24 h ou plus** ;
  2. à **moins de 24 h**, l'application l'invite à appeler le cabinet (numéro affiché) ;
  3. le créneau libéré est proposé **dans la minute** aux patients en liste d'attente ;
  4. le praticien voit l'annulation dans son agenda ;
  5. l'annulation est tracée (qui, quoi, quand).
- **Sprint 24** : du lundi 4 au vendredi 15 novembre 2026. Objectif du sprint :
  « Les patients peuvent annuler eux-mêmes leurs rendez-vous. » Vélocité moyenne : 34 points.
  Le jour de la visite est le **jeudi 14 novembre 2026**.

### La construction (postes 8 à 10)

- Branche Git : `feature/annulation-rdv`.
- Back-end (Awa) : route `POST /appointments/:id/cancel`, règle `hoursLeft < 24` → refus,
  transaction (annulation + créneau libéré), notification de la liste d'attente, journal.
- Front/mobile (Thomas) : écran « Mes rendez-vous », bouton **Annuler**, confirmation,
  messages de succès et de refus (composant partagé `PocketSantePhone`).
- Pull request **#318** « Annulation d'un rendez-vous par le patient », relue par **Marc**
  (dev senior). 2 commentaires, dont une suggestion : afficher le numéro du cabinet dans le
  message de refus. Approuvée après correction.

### La vérification (postes 11 et 12)

- QA (Inès) : 412 tests automatiques au vert ; recette manuelle sur iPhone et Android.
  **Bug BUG-77** : un rendez-vous dans **exactement 24 h** est refusé par l'application
  alors que le serveur l'accepte. Cause : le front comparait avec `<=` au lieu de `<`.
  Front et back n'appliquaient pas la règle de la même façon. Corrigé par Thomas, retesté.
- Sécurité (Léa) : données de santé → hébergement certifié **HDS** ; RGPD : minimisation
  (la notification envoyée à la liste d'attente indique seulement le créneau libre, jamais
  qui a annulé ni pourquoi) ;
  vérification que seul le patient peut annuler **son** rendez-vous ; journal d'accès ;
  analyse des dépendances : 1 vulnérabilité moyenne dans une bibliothèque de dates,
  mise à jour avant la mise en production.

### La mise en production et le retour (postes 13 et 14)

- Pipeline CI/CD (Ibrahima) : Build → Tests (412) → Analyse de sécurité → Déploiement en
  recette → Production progressive **5 % → 25 % → 100 %** des utilisateurs, avec un
  interrupteur de fonctionnalité `annulation-rdv` (retour arrière en un clic).
- Supervision (Camille), première semaine :
  **1 240 créneaux libérés**, dont **61 % repris** par un patient en liste d'attente ;
  rendez-vous non honorés : **18 % → 13 %** ; tickets « annulation » au support : **−70 %**.
  Une alerte le 2e jour : notifications de liste d'attente en retard (file saturée),
  résolue en 20 minutes.
- **La boucle repart** : de nouveaux tickets demandent « déplacer plutôt qu'annuler » → le
  support (poste 1) les remonte, une nouvelle idée entre dans le backlog.

## Les personnes

| #   | Personne        | Rôle                                                |
| --- | --------------- | --------------------------------------------------- |
| 1   | Lucie Martin    | Chargée de support client                           |
| 2   | Samir Haddad    | Chercheur UX (recherche utilisateur)                |
| 3   | Julien Moreau   | Analyste data (se déplace en fauteuil roulant)      |
| 4   | Claire Dubois   | Product Manager                                     |
| 5   | Mathilde Nguyen | Product Owner                                       |
| 6   | Hugo Lefèvre    | Designer UX/UI                                      |
| 7   | Fatou Sow       | Scrum Master                                        |
| 8   | Awa Diallo      | Développeuse back-end                               |
| 9   | Thomas Petit    | Développeur front-end / mobile                      |
| 10  | Marc Rousseau   | Développeur senior (revue de code)                  |
| 11  | Inès Garcia     | Testeuse QA                                         |
| 12  | Léa Kowalski    | Ingénieure sécurité                                 |
| 13  | Ibrahima Ndiaye | Ingénieur DevOps / SRE                              |
| 14  | Camille Robert  | Ingénieur·e SRE, supervision                        |
| 15  | Nadia Benali    | Engineering Manager (poste bonus, salle de réunion) |

## Les outils fictifs

Lumen Desk (support), Carnet UX (recherche), Lumen Insights (data), Lumen Roadmap (produit),
Lumen Board (backlog et sprint), Atelier Design (maquettes), Atelier Code (éditeur),
Lumen Git (revue de code), Lumen Test (QA), Lumen Shield (sécurité), Lumen CI (pipeline),
Lumen Watch (supervision), Lumen People (management).
