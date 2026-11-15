# METEO TEST — Plan d'implémentation (phases 07 → 08)

Document unique, actualisé après chaque lot et conservé comme trace. Ne pas le recréer à chaque reprise : ajouter l'état et les preuves dans la section « Suivi ».

- **Rédigé le** : 15/11/2026, phase 07, sans connexion à Notion.
- **Base examinée** : `main` @ `2dce94c`. `front-end/` et `design-preview/` sont identiques au commit de base (`git diff 2dce94c` vide) ; seuls `AGENTS.md` et `docs/` sont non suivis.
- **Statut** : plan validé le 15/11/2026. **Lot 1 implémenté et testé** sur la branche `phase-08-supabase` (non commitée). **En attente de la revue humaine** : la phase 08 n'est pas validée. Voir § 10.
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

1. Validation humaine de la phase 08 (lot 1 commité sur `phase-08-supabase` le 15/11/2026, sans push).
2. Sur instruction : commit sur `phase-08-supabase`. Aucun push vers `main` : il faut d'abord vérifier si un autodéploiement Vercel y est relié.
3. Phase 09 : importer `PRE-DEPLOIEMENT.md` (et `DEPLOYMENT.md` si la livraison est autorisée).
