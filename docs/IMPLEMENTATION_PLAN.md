# METEO TEST — Plan d'implémentation (phases 07 → 08)

Document unique, actualisé après chaque lot et conservé comme trace. Ne pas le recréer à chaque reprise : ajouter l'état et les preuves dans la section « Suivi ».

- **Rédigé le** : 15/11/2026, phase 07, sans connexion à Notion.
- **Base examinée** : `main` @ `2dce94c`. `front-end/` et `design-preview/` sont identiques au commit de base (`git diff 2dce94c` vide) ; seuls `AGENTS.md` et `docs/` sont non suivis.
- **Statut** : plan validé le 15/11/2026. **Lot 1 implémenté, testé et commité** (`c5413b0`, branche `phase-08-supabase`, sans push). **Phase 08 validée par l'humain le 15/11/2026.** Ce n'est pas un GO de production. Voir § 10.
- **Sources** : [PRD](PRD.md) (F/US/AC), [ARCHITECTURE](ARCHITECTURE.md) (cible validée), [FRONTEND](FRONTEND.md) (preuves réutilisables), et le code réel de `front-end/src/`.

## 1. Constat rapide du frontend (phase 04)

Les quatre écrans acceptés (E-001 `/login`, E-002 `/register`, E-003 `/weather`, E-004 `/admin`) correspondent à leur description dans FRONTEND.md. On ne les reconstruit pas et on ne touche pas au design system (`styles.css`, `ui.jsx`, `WeatherCard.jsx`, `Icons.jsx`). Les preuves de build, `npm test` et `npm run test:browser` restent valables pour le code actuel : elles n'ont pas été rejouées, puisque seule la documentation a changé.

Écarts et corrections utiles relevés dans le code, à traiter dans le lot :

| # | Constat (fichier) | Correction proposée |
| --- | --- | --- |
| C1 | `front-end/.gitignore` n'ignore aucun fichier `.env`. Le dépôt est public. | Ajouter `.env*.local` (convention Vite) **avant** de créer le premier fichier d'environnement. |
| C2 | `AuthPage.jsx` valide `email.trim()` mais ne garde pas la valeur nettoyée. | Envoyer l'email nettoyé (`trim`) à Supabase. |
| C3 | Dans `WeatherPage.jsx`, `current` peut valoir `undefined` ; `WeatherCard` planterait si une ville n'a pas de ligne en base. | Afficher `WeatherState status="empty"` quand une ville n'a pas de données (AC-010). |
| C4 | `PreviewStates` (ui.jsx) et le bouton « Revenir aux données fictives » ne servent qu'à l'aperçu. Une fois les vrais appels branchés, ils deviendraient faux. | Retirer `PreviewStates` de `WeatherPage`. Le bouton de reprise devient « Réessayer » et relance la lecture. Les états de chargement, d'erreur et d'absence de données viennent alors des vraies requêtes. |
| C5 | La bannière, le pied de page, les messages « indisponible » et les badges « Aperçu » / « Données fictives » (App, AuthPage, AdminPage) sont propres à l'aperçu. | Les retirer ou les reformuler **seulement** quand la fonction correspondante fonctionne vraiment (règle FRONTEND.md). |
| C6 | « Mon compte » (App.jsx) mène toujours à `/login`. Il n'existe aucune déconnexion. | Une fois connecté : afficher l'email et un bouton « Se déconnecter » dans le header existant (AC-005). |
| C7 | `tests/browser.mjs` vérifie le comportement de l'aperçu (messages « indisponible », bouton désactivé, `localStorage` vide). | Adapter ces assertions aux comportements réels, sans en supprimer pour masquer une régression (voir § 6). |

Aucun autre bug n'a été trouvé à la lecture. Validations, accessibilité, focus et responsive sont conservés tels quels.

## 2. Fonctionnalités non développées

| Fonction | Manque réel | AC |
| --- | --- | --- |
| F-001 Inscription | `signUp` Supabase, session immédiate, refus d'un email déjà utilisé, rôle Visiteur par défaut | AC-001, AC-002 |
| F-002 Connexion/déconnexion | `signInWithPassword`, `signOut`, restauration et perte de session, routes protégées | AC-003–005 |
| F-003 Autorisations | Source de rôle protégée et RLS sur toutes les tables exposées | AC-006–008 |
| F-004 Consultation | Lecture des trois villes en base, vrais états de chargement, d'erreur et d'absence de données, accès réservé aux comptes authentifiés | AC-009, AC-010 |
| F-005 Panneau Manager | Garde de route Manager, refus pour un Visiteur | AC-011, AC-012 |
| F-006 Modification | Enregistrement réel, contraintes côté base, persistance après actualisation | AC-013–015 |

## 3. Back-end réellement nécessaire

Le back-end se limite à Supabase en BaaS. Il n'y a ni serveur Node, ni Edge Function, ni webhook, ni stockage de fichiers, ni API externe. Le front appelle Supabase directement avec la **clé publique** (publishable/anon). La sécurité repose entièrement sur la RLS et sur les contraintes de la base.

Proposition minimale, à valider (voir décision D2) :

- **Auth** : Supabase Auth email/mot de passe, confirmation email **désactivée**, longueur minimale du mot de passe réglée à **8** pour rester cohérente avec `PASSWORD_MIN_LENGTH`.
- **Table `public.weather`** : colonnes `city` (PK, valeurs limitées à Paris, Lyon, Marseille), `temperature numeric not null` (valeurs finies : on exclut `Infinity`, `-Infinity` et `NaN`, que PostgreSQL 14+ accepte dans `numeric`), `condition text not null` (limitée aux quatre valeurs), `humidity numeric not null` (entre 0 et 100). Le seed insère les trois lignes du PRD.
- **Table `public.managers`** : une seule colonne `user_id uuid` (PK, référence `auth.users`, suppression en cascade). C'est la source protégée du rôle. **Aucune** politique d'insertion, de modification ou de suppression pour les clients : un Manager ne peut être ajouté que par une opération administrative (éditeur SQL du dashboard). Lecture limitée à sa propre ligne.
- **Fonction `public.is_manager()`** : `security definer`, `stable`, `search_path = ''`, utilisée par les politiques.
- **RLS activée sur les deux tables.**
  - `weather` : lecture pour `authenticated` ; modification pour `authenticated` si `is_manager()` (clauses `using` et `with check`) ; aucune insertion ni suppression.
  - Privilèges : `revoke all` pour `anon` ; `grant select, update (temperature, condition, humidity)` pour `authenticated`.
- **Liste des villes** : elle reste statique côté front (villes fixes, avec leur région, reprises de `src/data/weather.js`). Seules les valeurs viennent de la base. Une ville sans ligne affiche l'état vide.
- **Migrations** : un seul fichier SQL versionné, `supabase/migrations/<horodatage>_init.sql` (schéma, contraintes, RLS, privilèges, seed). Il sera appliqué au projet **de test** après vérification de la cible.

Hors périmètre volontaire : colonnes d'audit (`updated_at`, `updated_by`), gestion des utilisateurs, anti-abus avancé, rétention des comptes, Realtime.

## 4. Prérequis humains (bloquants avant d'appliquer la migration)

| # | Action | Par qui | Statut |
| --- | --- | --- | --- |
| P1 | Créer un projet Supabase Cloud **de test** (offre gratuite) et indiquer qui en est propriétaire | Humain | à faire |
| P2 | Dans Auth : désactiver la confirmation email et régler le mot de passe minimal à 8 | Humain, ou agent sur instruction | à faire |
| P3 | Fournir l'URL du projet et la clé **publique**, à placer dans `front-end/.env.local` (ignoré par Git après C1). Ne jamais fournir ni utiliser la clé `service_role`. | Humain | à faire |
| P4 | Créer deux comptes de test (Visiteur, Manager) via l'inscription de l'application, puis ajouter le Manager avec `insert into public.managers …` dans l'éditeur SQL | Humain (opération admin) | après la migration |
| P5 | Rendre les identifiants de test disponibles uniquement en variables d'environnement locales (`TEST_VISITOR_*`, `TEST_MANAGER_*`), jamais dans Git, les docs ou les logs | Humain | après P4 |

## 5. Lot unique — Lot 1 : raccordement Supabase Auth, données et RLS

Projet petit, dépendances linéaires : **un seul lot**, avec un point de contrôle interne. Travail sur une branche dédiée (par ex. `phase-08-supabase`). Pas de commit, de push ni de déploiement sans instruction.

**Étapes dans l'ordre :**

1. **Préparation** : C1 (`.gitignore`), création de la branche, `npm install @supabase/supabase-js`. C'est la seule dépendance ajoutée, et elle est indispensable.
2. **Base** : écrire la migration du § 3. L'appliquer sur le projet de test (P1–P3) après avoir vérifié la cible. Puis P4–P5.
3. **Tests de droits — point de contrôle** : écrire `tests/rls.test.js` (§ 6) et le faire passer **avant** de brancher l'interface. Si ce test échoue, on s'arrête.
4. **Client** : créer `src/supabase.js`, qui lit `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` et affiche une erreur explicite si elles manquent.
5. **Session et rôle** (App.jsx) : `getSession` + `onAuthStateChange`. Le rôle Manager est déduit de la lecture de sa propre ligne dans `managers`. Gardes : `/weather` et `/admin` redirigent vers `/login` sans session ; `/admin` affiche un refus pour un Visiteur (D3). Le lien « Administration » n'apparaît que pour un Manager, ce qui reste cosmétique puisque la RLS fait foi. Puis C6.
6. **Auth** (AuthPage.jsx) : `signUp` et `signInWithPassword` avec le bouton `loading` existant, puis C2. Les erreurs du fournisseur sont traduites (email déjà utilisé, identifiants incorrects, réseau) dans le `Message` existant. En cas de succès, redirection vers `/weather`.
7. **Consultation** (WeatherPage.jsx) : lecture de `weather`, vrais états, puis C3 et C4.
8. **Administration** (AdminPage.jsx) : le bouton d'enregistrement est activé et lance un `update` avec la validation client existante. Un refus ou une erreur s'affiche dans le `Message`. Après succès, les valeurs sont relues depuis la base. Le brouillon est réinitialisé à partir des valeurs en base. Puis C5.
9. **Nettoyage de l'aperçu** : C5 sur App et AuthPage, puis C7. Lancer `graphify update .` si l'outil est disponible ; sinon, noter la limite.
10. **Preuves** : rejouer les tests du § 6, mettre à jour ce plan (« Suivi ») et FRONTEND.md (comportements réels, preuves, limites).

**Critères de réussite du lot :** les 15 AC (AC-001 à AC-015) sont vérifiés sur le projet de test, chacun avec une preuve consignée. Aucun refus attendu n'aboutit. Le build et les tests existants passent. Aucun secret n'apparaît dans Git, le bundle ou les logs. `design-preview/` n'est pas modifié.

## 6. Tests critiques et preuves attendues

| Test | Ce qu'il vérifie | AC |
| --- | --- | --- |
| `npm test` (existant, inchangé) | Validations client et contrastes | AC-002/004/013 (saisie seulement) |
| `tests/rls.test.js` (nouveau, `node --test`, supabase-js et clé publique, **vraies sessions**) | **Anonyme** : la lecture de `weather` ne renvoie rien ou une erreur ; la modification est refusée. **Visiteur** : lit 3 lignes ; un `update` direct n'affecte aucune ligne et une relecture montre des données inchangées ; insertion et modification dans `managers` refusées ; insertion et suppression dans `weather` refusées. **Manager** : modification valide acceptée puis relue ; humidité 101, condition hors liste et température `Infinity` rejetées par la base ; insertion et suppression refusées. Les valeurs initiales sont restaurées à la fin. | AC-006–008, 013–015 |
| Inscription (dans `rls.test.js` ou manuelle documentée) | Un email inédit donne une session immédiate. Le même email une seconde fois est refusé. Le compte créé n'a aucune ligne dans `managers`. | AC-001, AC-002 |
| `npm run test:browser` (adapté, comptes de test fournis par l'environnement) | Les gardes redirigent sans session. Connexion Visiteur : affichage de la météo, refus sur `/admin`. Connexion Manager : enregistrement, actualisation, valeur persistée. Déconnexion : routes protégées inaccessibles. Mauvais identifiants : erreur et aucune session. État vide si une ligne manque. On conserve les contrôles existants (5 largeurs, labels, focus, mouvement réduit, console propre). L'assertion `localStorage` vide devient : seul le jeton de session Supabase (`sb-*-auth-token`) est présent, sans aucun rôle stocké côté client. | AC-003–005, 009–012, 014 |
| `npm run build`, puis recherche de `service_role` et de secrets dans `dist/` | Aucune clé privée dans le bundle | sécurité |

Preuve à consigner pour chaque test : commande, date, commit, cible (identifiant du projet de test, **sans clé**), résultat, périmètre et ce qui n'a pas été vérifié. Une requête SQL exécutée en admin ne prouve pas la RLS.

## 7. Modèles à utiliser

- **Déjà présents et utilisés au lot 1** : [DATA](DATA.md) (RLS, contraintes, migration), [SECURITY](SECURITY.md) (clé publique, rôle protégé, dépôt public), [TESTING](TESTING.md) (tests de droits et de persistance). On ne les remplit pas pour la forme : les décisions vivent dans ce plan et dans la migration.
- **Non importés pour la phase 08** : `BACKEND.md` (aucun code serveur), `DEPLOYMENT.md` (aucun déploiement en phase 08).
- **Phase 09** : importer `PRE-DEPLOIEMENT.md`, et `DEPLOYMENT.md` si la livraison Vercel est autorisée, depuis `Documents/PROJET LOCAL/BOITES-A-OUTILS/templates/` (source vérifiée et présente le 15/11/2026).

## 8. Risques

| Risque | Mesure |
| --- | --- |
| Une RLS mal écrite expose ou permet d'écrire des données | Point de contrôle à l'étape 3 avec de vraies sessions anonyme, Visiteur et Manager avant toute intégration de l'interface |
| Fuite de secret dans un dépôt public | C1 en premier ; uniquement la clé publique ; comptes de test hors Git ; recherche de secrets dans `dist/` |
| Escalade vers le rôle Manager | Le rôle vient de la table `managers`, sans politique d'écriture côté client, et jamais de `user_metadata` |
| Email non vérifié (inscription avec l'adresse d'un tiers) | Risque accepté pour ce test (PRD), à réexaminer si le produit change de destination |
| Jeton de session dans `localStorage`, exposé en cas de XSS | Comportement standard de supabase-js pour une SPA. Aucun `dangerouslySetInnerHTML` ni contenu HTML externe dans le code. Accepté pour ce test. |
| Comptes de test créés à chaque exécution du test d'inscription, et limites de débit ou refus de certains domaines email par Supabase | Inscription testée une seule fois ou avec une adresse dédiée ; nettoyage manuel dans le dashboard ; limite à noter dans les preuves |
| Un seul projet partagé entre le test et une future production | Accepté au cadrage. Le seed et les tests ne visent que le projet de test vérifié, et les tests restaurent les valeurs. |
| Le script navigateur dépend du port 5173 et d'un vrai projet | Limite connue, documentée ; pas de faux backend |

## 9. Décisions demandées avant la phase 08

- **D1 — Projet Supabase** : qui le crée (P1), et qui applique la migration : l'agent via la CLI ou le connecteur Supabase sur instruction, ou bien vous via l'éditeur SQL ?
- **D2 — Schéma et rôle** : valider le § 3, c'est-à-dire la table `managers` comme source du rôle (recommandé, plutôt que `app_metadata`) et des noms de tables en anglais.
- **D3 — Visiteur sur `/admin`** : afficher un refus sur place avec le `Message` existant (recommandé, aucune nouvelle page) ou rediriger vers `/weather` ?
- **D4 — Branche et commits** : travailler sur `phase-08-supabase` sans commit ni push jusqu'à votre instruction ?

## 10. Suivi

| Date | Lot / étape | État | Preuves / remarques |
| --- | --- | --- | --- |
| 15/11/2026 | Plan initial (phase 07) | proposé | Lecture du code à `2dce94c`, sans exécution de tests (aucun changement de code). En attente d'accord. |
| 15/11/2026 | Accord humain | validé | D2 (table `managers`), D3 (refus sur place), D4 (branche `phase-08-supabase`, sans commit ni push) validés. Projet de test : réf. `svteqpuyzyncwyqgodua`. |
| 15/11/2026 | Lot 1 · étapes 1–2 | en cours | Branche créée ; C1 fait (`.env*.local` ignoré) ; migration écrite dans `supabase/migrations/20261115000000_init.sql`, **non appliquée**. Le connecteur Supabase renvoie « permission refusée » sur ce projet : en attente de la clé publique et des réglages Auth (P2–P3). |
| 15/11/2026 | Lot 1 · étapes 2–3 | fait | P2–P3 faits par l'humain : `mailer_autoconfirm: true` vérifié via `/auth/v1/settings` ; migration exécutée dans SQL Editor ; accès anonyme à `weather` refusé (42501). Comptes de test créés par `signUp` (session immédiate), identifiants seulement dans `front-end/.env.local` (ignoré par Git). Rôle Manager ajouté par l'humain avec une insertion SQL admin. **Point de contrôle franchi** : `RUN_SIGNUP_TEST=1 npm run test:rls` donne 7/7. |
| 15/11/2026 | Lot 1 · étapes 4–10 | fait, en attente de revue | Écrans branchés (détail plus bas). Preuves : voir le tableau suivant. |

### Lot 1 — ce qui a été livré

- **Base** : `supabase/migrations/20261115000000_init.sql` (tables `weather` et `managers`, `is_manager()`, RLS, privilèges, seed). Appliquée sur le projet de test `svteqpuyzyncwyqgodua`.
- **Front** :
  - `src/supabase.js` : client avec la clé publique, et `loadWeather()`.
  - `App.jsx` : session, rôle lu dans `managers`, gardes de route, « Se déconnecter », lien Administration réservé au Manager, bannière et pied de page d'aperçu retirés.
  - `AuthPage.jsx` : `signUp` / `signInWithPassword`, erreurs traduites, email nettoyé (`trim`), mention « indisponible » et lien vers l'aperçu retirés.
  - `WeatherPage.jsx` : vraie lecture et vrais états ; `PreviewStates` supprimé ; bouton « Réessayer ».
  - `AdminPage.jsx` : enregistrement réel, refus affiché sur place pour un Visiteur (D3), réinitialisation sur les valeurs enregistrées.
  - `data/weather.js` : ne contient plus que la liste fixe des villes (les valeurs fictives sont supprimées).
- **Tests** : `tests/rls.integration.mjs` (`npm run test:rls`), `tests/browser.mjs` adapté (`npm run test:browser` lit maintenant `.env.local`).
- **Corrections C1–C7** : toutes faites. Le design system n'a pas été modifié ; les styles `.save-unavailable` et `.preview-banner` sont désormais inutilisés et ont été laissés en place.
- **Dépendance ajoutée** : `@supabase/supabase-js` ^2.119.0 (`npm install` : 0 vulnérabilité signalée).

### Preuves — 15/11/2026, Windows 11, Node 24.21.0, base `2dce94c` plus modifications non commitées, projet Supabase de test `svteqpuyzyncwyqgodua`

| Commande (depuis `front-end/`) | Résultat | Périmètre |
| --- | --- | --- |
| `RUN_SIGNUP_TEST=1 npm run test:rls` | 7 réussis, 0 échec | Accès anonyme refusé ; Visiteur : 3 villes lues, écritures directes refusées et données inchangées, rôle impossible à lire ou à s'attribuer ; Manager : enregistrement relu dans une nouvelle session ; 101, -1, « Neige », `Infinity` et `NaN` rejetés par la base ; insertion et suppression refusées ; inscription avec session immédiate, doublon refusé |
| `npm run test:rls` (relancé après les tests navigateur) | 6 réussis, 1 ignoré (inscription, sur option), 0 échec | Idem ; valeurs de départ restaurées |
| `npm run test:browser` (Chrome, Vite déjà actif sur 5173 : le processus de ce projet, rechargé avec `.env.local`) | PASS | Gardes sans session ; 4 routes × 5 largeurs sans débordement ; labels ; focus clavier ; erreurs de saisie ; mauvais mot de passe refusé sans session ; email en double refusé ; Visiteur : 3 villes affichées, pas de lien d'administration, refus sur `/admin` ; déconnexion puis redirection ; Manager : enregistrement, valeur persistante après rechargement et visible sur `/weather`, seed restauré ; réinitialisation ; mouvement réduit ; seul le jeton `sb-*-auth-token` est stocké côté client ; console propre |
| `npm test` | 3 réussis, 0 échec | Validations client et contrastes, inchangés |
| `npm run build`, puis recherche de `service_role` / `sb_secret` dans `dist/` | Build OK. La seule occurrence trouvée est un littéral de la bibliothèque supabase-js qui reconnaît le préfixe `sb_secret_` ; aucune clé secrète n'est présente | Seule la clé publique figure dans le bundle |
| `git diff 2dce94c -- design-preview` | vide | Référence graphique intacte |
| Captures 390 et 1440 px (dossier temporaire hors dépôt) | Inspectées : design conforme à l'aperçu validé | Visuel |

### Couverture des AC

- **Prouvés par les tests ci-dessus** : AC-001 à AC-009 et AC-011 à AC-015.
- **AC-010** (aucune donnée) : implémenté (une ville sans ligne affiche l'état vide, une erreur de lecture affiche l'état d'erreur avec « Réessayer »), mais **non testé sur des données réelles**. Le tester demanderait de supprimer une ligne en base avec un accès admin : c'est une opération destructive. **Décision humaine du 15/11/2026 : test réel non requis.**

### Écarts et limites

- **Security Advisor** (consulté par l'humain le 15/11/2026 : 0 erreur, 2 avertissements) :
  - « Signed-In Users Can Execute SECURITY DEFINER Function » (`is_manager()`) : **corrigé**. La fonction passe en `security invoker` (migration `20261115010000_is_manager_invoker.sql`, appliquée par l'humain dans SQL Editor) ; elle lit `managers` sous RLS, et seulement la ligne de l'appelant. Nouveau passage de `npm run test:rls` : 6 réussis, 1 ignoré (inscription), 0 échec.
  - « Leaked Password Protection Disabled » : **risque accepté par l'humain** le 15/11/2026. La fonction est réservée à l'offre Pro, alors que la cible est 0 €/mois. Atténuations : 8 caractères minimum, aucune donnée sensible. À réexaminer en phase 09 ou si la destination du produit change.
- La longueur minimale de 8 caractères côté Supabase est confirmée par l'humain, mais pas testée. L'expiration de session n'est pas testée.
- `graphify` est absent : impossible de mettre à jour le graphe.
- Comptes restant dans Auth : `meteo-visitor-…`, `meteo-manager-…` (comptes de test) et un compte `+signup…` créé par le test d'inscription. Ils sont à supprimer depuis le dashboard quand ils ne serviront plus.
- Le script navigateur reste lié au port 5173 et à un vrai projet Supabase.

### Prochaine action

1. ~~Validation humaine de la phase 08~~ : validée le 15/11/2026.
2. Sur instruction : commit sur `phase-08-supabase`. Aucun push vers `main` : il faut d'abord vérifier si un autodéploiement Vercel y est relié.
3. Phase 09 : importer `PRE-DEPLOIEMENT.md` (et `DEPLOYMENT.md` si la livraison est autorisée).
   → Fait le 15/11/2026 : `docs/PRE-DEPLOIEMENT.md` et `docs/DEPLOYMENT.md`, copies exactes des modèles de la boîte à outils, sans ajout ; les décisions sont consignées ci-dessous.

## 11. Phase 09 — Audit pré-déploiement et préparation Vercel

Commencée le 15/11/2026 sur `phase-08-supabase`. La validation de phase 08 n'est pas commitée, à la demande de l'humain. Audit mené selon `PRE-DEPLOIEMENT.md` et `DEPLOYMENT.md`, en réutilisant les preuves du § 10.

### Contexte constaté

- **Projet** : personnel, pédagogique, non commercial, gratuit. Éditeur : un particulier, en France. Public : toute personne peut s'inscrire (B2C), avec une simple adresse email.
- **Données personnelles** : email et mot de passe haché (Supabase Auth), jeton de session en `localStorage`. Pas d'analytics, pas de script tiers, pas de police externe, pas d'emails envoyés (confirmation désactivée).
- **Prestataires** : Supabase (Auth et base ; région du projet **non vérifiée**) et Vercel (hébergement du front, prévu).
- **GitHub** (`gh`, compte propriétaire) : dépôt public ; aucun webhook ; aucun déploiement ; aucun statut ni check sur `main` ; `main` **non protégée**. Les applications GitHub installées, dont Vercel, ne sont pas listables avec le jeton actuel : **non vérifié**. Aucun `vercel.json` ni dossier `.vercel` n'existait.

### Contrôles

| Domaine | Statut | Preuve / action |
| --- | --- | --- |
| Mentions légales (LCEN) | **à corriger** | Absentes. Un particulier peut ne publier que les coordonnées de l'hébergeur, à condition d'avoir transmis son identité à celui-ci ; sinon, son nom. Les informations doivent venir de l'humain : rien ne doit être inventé. |
| Contrats, vente | non applicable | Service gratuit, ni vente ni abonnement |
| RGPD | **à corriger** | Comptes ouverts à tous, donc l'exemption « usage domestique » ne s'applique pas. Il manque l'information au moment de l'inscription : responsable et contact, finalité (authentification), base légale (exécution du service), durée de conservation (**non décidée**), destinataires et sous-traitants (Supabase, Vercel), transferts hors UE, droits et moyen de les exercer (suppression du compte sur demande). Les contrats de sous-traitance (DPA) sont ceux des conditions standard de Supabase et de Vercel : **non vérifié**. |
| Cookies / traceurs | cohérent | Seul le jeton de session, strictement nécessaire à l'authentification, est stocké (assertion du test navigateur). Pas d'autre traceur, donc pas de bandeau. |
| Accessibilité | cohérent, avec réserve | Labels, focus clavier, contrastes ≥ 4,5:1, 5 largeurs, mouvement réduit (§ 10). Lecteur d'écran et autres navigateurs : non vérifiés. La directive (UE) 2019/882 vise les opérateurs économiques, et le RGAA ne s'applique pas à un particulier non commercial : régime légal non applicable, à confirmer par l'humain. |
| Contenus et licences | cohérent | Textes définitifs en français, icônes SVG maison, polices système. Pas de contenu tiers. |
| Visibilité | décision | Pas de `robots`, de description ni de sitemap. Pour une application de test, `noindex` est recommandé (ce n'est pas une mesure de sécurité). |
| Sécurité publique | **corrigé, avec réserves** | **Bug corrigé** : sans réécriture, ouvrir ou recharger directement `/weather` ou `/admin` sur Vercel aurait renvoyé 404. `front-end/vercel.json` ajoute cette réécriture ainsi que les en-têtes CSP stricte, `nosniff`, `Referrer-Policy` et `Permissions-Policy`. Test : build de production servi localement avec ces en-têtes, puis flux navigateur complet : PASS ; styles et scripts chargés, comme le montre une capture. Les violations CSP ne sont pas capturées par le test, d'où une vérification à refaire sur la preview Vercel. Réserves : `npm audit --omit=dev` donne 0 ; historique Git sans secret ; HTTPS fourni par Vercel, à vérifier ; anti-abus limité aux quotas par défaut de Supabase (pas de CAPTCHA) ; MFA sur GitHub, Vercel et Supabase non vérifiée ; protection contre les mots de passe compromis : risque accepté. |
| Sauvegarde / reprise | réserve | Les données métier (3 lignes) se recréent avec la migration de seed. Les comptes ne bénéficient d'aucune sauvegarde vérifiée sur l'offre gratuite : leur perte est acceptable pour un test, mais ce n'est **pas un rollback de données**. Retour arrière du front : redéployer la version précédente depuis Vercel. |
| Isolation des environnements | réserve acceptée | Previews et production partagent le même projet Supabase (risque accepté au cadrage). Seule la clé publique est utilisée, et la RLS protège les deux. |
| Comptes de test | décision | Le seul Manager est un compte de test. Il faut un vrai compte Manager pour l'humain, puis supprimer les comptes de test après le smoke test. |

### Verdict provisoire : **NO GO**

Deux obligations applicables ne sont pas satisfaites : les mentions légales et l'information RGPD. Une fois corrigées, le verdict au mieux sera **GO AVEC RÉSERVES** (MFA, région Supabase et DPA non vérifiés ; anti-abus minimal ; pas de sauvegarde des comptes ; base partagée). L'audit n'autorise ni fusion ni mise en production.

### Livraison prévue (après correction et GO humain)

| Étape | Action | État |
| --- | --- | --- |
| Préparer | Ajouter les mentions légales et la confidentialité ; relancer les tests ciblés ; commit sur la branche | prévu |
| Configurer | L'humain crée le projet Vercel lié au dépôt : Root Directory `front-end`, preset Vite, variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` pour Production et Preview | prévu (humain) |
| Preview | Push de `phase-08-supabase`, qui produit une preview Vercel (pas la production) ; smoke test : HTTPS, en-têtes, rechargement direct de `/weather`, connexion des deux rôles, enregistrement, console sans violation CSP, `/.env` et `/.git/` inaccessibles | prévu, sur instruction de push |
| Production | Fusion vers `main`, qui déploie automatiquement en production une fois Vercel relié : **GO humain explicite pour cette action** ; smoke test de l'URL ; dans Supabase, régler Site URL sur l'URL publiée | prévu, sur GO |
| Retour arrière | « Instant Rollback » ou redéploiement du commit précédent depuis Vercel | prévu |

### Corrections du 15/11/2026 (décisions humaines)

- **Décisions** : page autorisée ; identité « particulier, identité communiquée à l'hébergeur » ; contact `contact@kizzkiss.com` ; conservation jusqu'à demande, et suppression de tous les comptes à la fin du test ou après 12 mois d'inactivité ; région Supabase dans l'UE (pas de transfert hors UE pour Supabase) ; `noindex`.
- **Implémenté** :
  - `src/pages/LegalPage.jsx`, route publique `/mentions-legales`, avec lien dans le pied de page et sous le formulaire d'inscription ;
  - `<meta name="robots" content="noindex, nofollow">` dans `index.html` ;
  - quelques règles CSS ajoutées en fin de `styles.css` (liens soulignés, espacements) ;
  - mentions légales (LCEN) et information RGPD : **corrigées**.
- **Réserves restantes** :
  - adresse de Vercel Inc. reprise de ses informations publiques, mais **non revérifiée** ce jour, et numéro de téléphone de l'hébergeur non affiché (exigé par la LCEN), à confirmer sur vercel.com/legal ;
  - contrats de sous-traitance (DPA) Supabase et Vercel, et MFA des comptes : non vérifiés.
- **Tests** (Node 24.21.0, Chrome, Vite actif sur 5173, projet de test) :
  - `npm test` : 3 réussis, 0 échec ;
  - `npm run build` : réussi ;
  - `npm run test:browser` : PASS **trois fois de suite**, avec en plus la page légale (lien, mise en page sur 5 largeurs, contact, `noindex`) ; capture de la page légale à 390 px inspectée ;
  - `npm run test:rls` : 6 réussis, 1 ignoré, 0 échec.
- **Défaut de test corrigé** : `Page.reload` rend la main avant le rechargement, si bien que l'attente pouvait lire l'ancien DOM (échec intermittent). Le test attend désormais un nouveau document. Un échec intermittent laissait aussi Paris à -12,5 ; les valeurs de départ ont été restaurées par `test:rls`, puis vérifiées par une lecture en tant que Manager.
- **Verdict mis à jour** : **GO AVEC RÉSERVES** pour une **preview** Vercel ; la production nécessite le smoke test de la preview et un GO humain explicite. Le projet Vercel est créé par l'humain ; aucun déploiement n'apparaît encore côté GitHub au moment du contrôle.

### Preview Vercel (15/11/2026)

- GO humain pour commit et push de la branche seulement. Commit `0348c4b`, push de `phase-08-supabase` (aucune action sur `main`).
- Statut GitHub « Vercel » : `success` (build de la preview réussi).
- La preview `meteo-test-git-phase-08-supabase-revostra-3586.vercel.app` redirige (302) vers la connexion Vercel (Deployment Protection) : elle n'est pas publique, ce qui est conforme à DEPLOYMENT règle 2. Smoke test automatisé **impossible sans accès** : à faire par l'humain dans son navigateur connecté, ou via un jeton de contournement.
- `meteo-test.vercel.app` n'est **pas** ce projet (autre application, « weather-app », en anglais). L'URL de production réelle reste à relever dans Vercel → Domains.
- **Smoke test de la preview, fait par l'humain le 15/11/2026, tout est conforme** : rechargement direct de `/weather` qui mène à la connexion (pas de 404) ; Visiteur : trois villes affichées ; Manager : enregistrement persistant après rechargement, puis valeur d'origine remise ; `/mentions-legales` affichée. Console : une seule violation CSP, `vercel.live/_next-live/feedback/feedback.js`, la barre d'outils Vercel injectée sur les previews pour les membres de l'équipe. Son blocage est voulu, la CSP n'est pas élargie ; l'humain peut désactiver la barre dans Vercel → Settings → General.
- **GO production explicite de l'humain le 15/11/2026** : fusion en avance rapide de `phase-08-supabase` dans `main`, puis push, qui déclenche le déploiement de production Vercel.

### Production (15/11/2026)

- **URL** : https://meteo-test-cyan.vercel.app/. `main` est en `a685c2d` (fusion en avance rapide de `phase-08-supabase`). Statut Vercel : `success`.
- **Smoke test par l'agent** (curl, depuis Windows) :
  - HTTP redirige en 308 vers HTTPS ; HSTS actif (`max-age=63072000; includeSubDomains; preload`).
  - En-têtes conformes à `vercel.json` : CSP, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
  - `/weather`, `/admin` et `/mentions-legales` répondent 200 (application à page unique, pas de 404 en accès direct).
  - `/.env`, `/.env.local`, `/.git/config`, `/vercel.json` et `/package.json` ne servent que la page `index.html` : aucun fichier sensible n'est publié.
  - `noindex` est présent.
  - Le bundle contient l'URL du projet Supabase et aucune clé secrète ni identifiant de test.
- **Parcours fonctionnel** : vérifié par l'humain sur la preview du même code applicatif (seule la doc diffère entre `0348c4b` et `a685c2d`), avec la même base Supabase. Le test navigateur automatisé n'a pas été rejoué en production, pour éviter d'écrire dans les données publiées.
- **Reste à faire par l'humain** :
  - Supabase : Authentication → URL Configuration → Site URL = l'URL de production (sans effet tant qu'aucun email n'est envoyé, mais à aligner) ;
  - créer son propre compte Manager, puis supprimer les comptes de test (`meteo-visitor-…`, `meteo-manager-…`, `+signup…`) ;
  - vérifier l'adresse et le téléphone de Vercel dans les mentions légales ;
  - activer la MFA sur GitHub, Vercel et Supabase ;
  - désactiver éventuellement la barre d'outils Vercel sur les previews.
- **Statut de la phase 09** : publication effectuée et vérifiée. **Phase 09 validée par l'humain le 15/11/2026.** Mise à jour Notion demandée ; non effectuée par l'agent, car le connecteur Notion n'est pas authentifié. Retour arrière : Vercel → Deployments → Instant Rollback (le code seulement ; les données ne sont pas restaurées).
