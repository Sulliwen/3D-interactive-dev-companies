# Bible du scénario « Lancer un nouveau produit : de l'idée au premier client »

Faits communs à tous les écrans et fiches du scénario `nouveau-produit`. **Tout chiffre, nom
ou identifiant affiché doit être cohérent avec ce document.** Le modifier ici d'abord, puis
partout. L'entreprise, les personnes et les outils fictifs sont ceux de
[`fil-rouge.md`](fil-rouge.md) ; la v2 de Pocket Santé est décrite dans
[`fil-rouge-v2.md`](fil-rouge-v2.md).

## Le contexte

- **Pocket Santé 2** a basculé tous les patients en **septembre 2027** ; la v1 s'arrête en
  **décembre 2027**. L'équipe Pocket Santé redevient disponible pour autre chose.
- **Tournée** (nom de code devenu nom du produit) : une application mobile pour les
  **infirmières et infirmiers libéraux** qui soignent à domicile. Elle montre la tournée du
  jour (patients, ordre de passage, soins à faire) et, surtout, permet d'écrire des
  **transmissions** aux collègues du même cabinet. Elle fonctionne **hors connexion**
  (voiture, campagne, immeubles sans réseau).
- Prix visé : **19 € par mois et par infirmière**.
- **Message clé n° 1 : on valide le problème avant de construire la solution.** Découverte,
  chiffres, prototype cliquable : on n'écrit du code qu'après le feu vert.
- **Message clé n° 2 : on avance par hypothèses risquées.** Chacune est vérifiée, et
  l'une d'elles est **invalidée** (l'itinéraire automatique) : c'est aussi un résultat.
- **Message clé n° 3 : la plupart des idées s'arrêtent au comité (étape 3), et c'est
  normal.** Tournée a un budget limité (3 mois) et des critères d'arrêt écrits d'avance.

## L'origine de l'idée

- En janvier 2027, pour la v2, Samir interroge des parents. Plusieurs, comme **Sarah**
  (la persona de Pocket Santé, infirmière), sont infirmières. Deux d'entre elles,
  **libérales**, lui montrent leur **cahier de tournée** et la conversation SMS de leur
  cabinet : c'est là que tout se passe, et que tout se perd.
- Juin 2027 : Claire obtient **10 semaines d'exploration** (Samir et Julien à mi-temps)
  pour savoir si le problème est réel et assez répandu.

## Le calendrier

- **6 juillet → 10 septembre 2027** : découverte (Samir, Julien).
- **Mardi 5 octobre 2027** : comité produit, décision de continuer (Claire).
- **11 → 22 octobre 2027** : test du prototype cliquable avec 6 infirmières (Hugo).
- Fin octobre : carte du MVP (Mathilde).
- **Sprint 0 : lundi 8 → vendredi 19 novembre 2027** (Fatou). Sprints de 2 semaines :
  sprint 1 du 22 novembre au 3 décembre, sprint 2 du 6 au 17 décembre, pause de Noël, sprint 3
  du 3 au 14 janvier, sprint 4 du 17 au 28 janvier, sprint 5 du 31 janvier au 11 février.
- **Lundi 10 janvier 2028** : ouverture du pilote à 20 infirmières (Ibrahima).
- **Jour de la visite : jeudi 10 février 2028**, semaine 5 du pilote, jour 9 sur 10 du sprint 5.
- **Mardi 14 mars 2028** : comité de décision (continuer et recruter, ou arrêter).
- Budget : **3 mois de construction** (8 novembre 2027 → 4 février 2028) pour une équipe
  de 5, puis un mois de pilote mesuré.

## La découverte (Recherche UX : Samir ; Data : Julien)

- **15 entretiens** : **12 infirmières libérales** et **3 patients soignés à domicile**,
  plus **3 tournées accompagnées** en voiture (départ 6 h 30).
- Persona : **Karine, 46 ans**, infirmière libérale à **Villefranche-sur-Saône**, cabinet
  de 3 infirmières, environ 30 patients par jour (tournée du matin 6 h 30 → 13 h, tournée
  du soir 17 h → 20 h). Citation : « Le soir, je passe quarante minutes à écrire des SMS à
  mes collègues pour leur dire où en sont mes patients. »
- Le problème : « Les infirmières d'un même cabinet se partagent les patients, mais tout ce
  qu'elles doivent se transmettre passe par des SMS et un cahier : oublis, soins faits deux
  fois, remplaçante perdue. » **13 entretiens sur 15** le mentionnent spontanément.
- Data (Julien) : environ **100 000 infirmiers libéraux** en France (estimation),
  **11 500** en Auvergne-Rhône-Alpes ; **62 %** exercent en cabinet de groupe.
  Questionnaire en ligne : **214 réponses** ; ce qui leur fait perdre le plus de temps :
  transmissions entre collègues **41 %**, préparer l'ordre de passage 19 %, facturation et
  télétransmission 17 %, commandes de matériel 12 %, autre 11 %. Page de présentation avec
  liste d'attente : **640 inscrits** en 10 semaines (35, 48, 52, 61, 66, 70, 74, 76, 79,
  79 par semaine).
- Projection : 2 % des infirmiers libéraux de France abonnés à 19 € / mois ≈
  **456 000 € par an** ; la région seule ≈ 52 000 € par an.

## La décision (Product Manager : Claire)

- Comité du **mardi 5 octobre 2027** : **on continue**, budget 3 mois, équipe de 5.
- Les **4 hypothèses risquées** (affichées au tableau de la salle de réunion) :
  - **H1 Problème** : les transmissions entre collègues font perdre du temps et causent des
    oublis. → **validée** à la découverte (13 / 15).
  - **H2 Usage** : elles l'utiliseront chaque jour pendant la tournée, même sans réseau.
    → **validée** au pilote (9 / 20 actives chaque semaine ; 31 % des transmissions écrites
    sans réseau).
  - **H3 Itinéraire** : elles veulent que l'application calcule l'ordre de passage.
    → **invalidée** au test du prototype : 5 infirmières sur 6 gardent leur propre ordre
    (soins à heure fixe, comme l'insuline, habitudes des patients).
  - **H4 Paiement** : un cabinet paiera 19 € / mois / infirmière. → **validée** de justesse :
    3 cabinets sur 7 ont signé.
- **Critères écrits d'avance** : au bout de 4 semaines de pilote, au moins **40 %** des
  pilotes actives chaque semaine **et** au moins **3 cabinets** prêts à payer → on continue.
  Sinon, on arrête et on documente ce qu'on a appris.
- OKR de l'exploration : « Savoir, d'ici mars 2028, si Tournée mérite de devenir un
  produit. »

## La préparation (Design : Hugo ; Product Owner : Mathilde ; Scrum Master : Fatou)

- Prototype cliquable (Hugo), sans une ligne de code, testé **du 11 au 22 octobre 2027** avec
  **6 infirmières** (4 libérales, 2 de centre de soins). **6 sur 6** retrouvent le patient
  suivant en moins de 10 secondes ; **5 sur 6** ignorent l'itinéraire automatique ;
  **4 sur 6** demandent les transmissions « en premier, avant la liste ».
- Carte du MVP (Mathilde), tickets **TRN** :
  - TRN-1 Voir ma tournée du jour, même sans réseau (8 points) ;
  - TRN-2 Ouvrir la fiche d'un patient (5) ;
  - TRN-3 Cocher un soin fait (3) ;
  - **TRN-4 Écrire une transmission pour mes collègues (5)** : la story suivie ;
  - TRN-5 Lire les transmissions avant ma tournée (3) ;
  - TRN-6 Réordonner ma tournée à la main (3) ;
  - TRN-7 Inviter les collègues de mon cabinet (5, à affiner).
  - MVP : 32 points.
  - **Écartés volontairement** : TRN-8 itinéraire automatique (H3 invalidée), TRN-9
    facturation et télétransmission (leur logiciel actuel le fait déjà), TRN-10 prise de
    rendez-vous par les patients.
- **Équipe Tournée (5 personnes)** : Mathilde (Product Owner, mi-temps), Hugo (design,
  mi-temps), Awa (back-end), Thomas (front-end / mobile), Inès (QA). Fatou accompagne les
  deux équipes ; Marc relit le code ; Léa, Ibrahima et Camille interviennent comme pour
  Pocket Santé.
- Sprint 0 : règles de travail de l'équipe (« accord d'équipe »), dépôt de code, chaîne de
  déploiement, squelette de bout en bout. Sprint 1 : objectif « Karine voit sa tournée du
  jour sur son téléphone, même en mode avion. » Capacité 21 points.

## La construction (Back-end : Awa ; Front-end : Thomas ; Revue de code : Marc)

- **ADR-001** « Fondations de Tournée » (Awa, fusionnée le 9 novembre 2027) : on reprend
  des technologies déjà maîtrisées avec Pocket Santé (TypeScript, Node.js, PostgreSQL,
  React Native) ; données **d'abord sur le téléphone** puis synchronisées ; hébergement
  certifié **HDS** dès le premier jour.
- **Squelette de bout en bout** (en ligne le mercredi 10 novembre 2027, 3e jour du sprint 0) : une seule fonction (« voir la
  tournée du jour ») qui traverse tout le système, du téléphone à la base de données, et
  déployée sur l'hébergement HDS. Dépôts `tournee-api` et `tournee-app`.
- Front-end : base locale sur le téléphone, **file d'envoi** des transmissions écrites sans
  réseau, envoyées dès le retour du réseau.
- **Pull request #3** « Conventions de l'équipe Tournée » (Marc), branche
  `chore/conventions`, 10 novembre 2027 : `CONTRIBUTING.md`, lint, format, modèle de PR.
  Règles : une PR = un sujet, moins de 400 lignes, **une** relecture obligatoire (deux pour les données de santé, dont Léa ; proposition initiale : deux pour tout, ajustée en relecture), tests verts.
  Les mots du métier restent en français dans le code (`tournee`, `transmission`, `soin`).

## La vérification et l'ouverture (Sécurité : Léa ; DevOps : Ibrahima ; QA : Inès)

- Sécurité : hébergeur certifié **HDS**, **AIPD** (analyse d'impact RGPD) signée le
  29 octobre 2027 ; minimisation : **pas de numéro de sécurité sociale** dans le MVP ;
  données du téléphone chiffrées, verrouillage par code, effacement à distance ; une
  infirmière ne voit que les patients **de son cabinet**.
- Pipeline (Ibrahima) n° **212** « Tournée · ouverture du pilote », lundi 10 janvier 2028,
  commit `a3f9e27` ; le pipeline n° 1 a tourné le 10 novembre 2027. Interrupteur
  `pilote-tournee` : équipe (5 comptes de test) → cabinet des Tilleuls à Villefranche
  (3 infirmières) → **7 cabinets, 20 infirmières**.
- Pilote : **20 infirmières dans 7 cabinets** du Rhône. Semaine 2 (17 janvier) : **47 retours**
  triés par Inès en 5 semaines (6 bugs dont 1 majeur, 29 idées, 12 questions).
- **BUG-T-14** (trouvé le 17 janvier 2028) : une transmission écrite hors connexion
  disparaît quand une collègue modifie la même fiche avant la synchronisation. Cause : à la
  synchronisation, la liste reçue **remplaçait** celle du serveur. Corrigé par Awa
  (fusion sans écraser), déployé le 24 janvier.

## Le pilote mesuré (Supervision : Camille)

- Infirmières actives chaque semaine (sur 20) : S1 15 (75 %), S2 12 (60 %), S3 8 (40 %),
  S4 9 (45 %), S5 9 (45 %).
- Tournées préparées : 61, 88, 93, 84, 86 (412 en tout). Transmissions écrites : 180, 260,
  300, 290, 310 (**1 340** en tout), dont 31 % sans réseau.
- Abonnements payants : **3 cabinets, 8 infirmières** (152 € par mois).

## Pendant ce temps (hors scénario)

- **Lucie** (support) répond toujours aux patients de Pocket Santé. Tournée n'a pas encore
  de vrais clients : les 20 pilotes écrivent directement à Samir et Inès.
- **Nadia** (Engineering Manager, poste bonus) : a composé l'équipe Tournée ; Awa, Thomas et
  Inès quittent Pocket Santé, où restent Chloé (back-end) et Yanis (front-end) ; Nadia
  recrute un·e **QA pour Pocket Santé**.

## Résultats affichés à la fin

- Entretiens de découverte : 0 → **15** (et 3 tournées accompagnées).
- Hypothèses risquées tranchées : 0 / 4 → **4 / 4** (3 validées, 1 invalidée).
- Infirmières pilotes actives chaque semaine : 0 → **9 sur 20**.
- Cabinets abonnés payants : 0 → **3**.
