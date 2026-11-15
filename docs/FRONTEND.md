# METEO TEST — Passation persistante du frontend Codex

Ce fichier décrit le code livré ; ce n’est pas une copie du modèle générique `FRONTEND.md`. Réalisation et tests du 15/11/2026, acceptation humaine explicite des quatre écrans en [phase 04](https://app.notion.com/p/419282ff070c80c1a073c6f4d3ccada4). Référence graphique `design-preview/` validée et conservée intacte.

> **Mise à jour du 15/11/2026, phase 08, lot 1.** Les écrans sont désormais raccordés à Supabase : connexion, inscription et déconnexion réelles, gardes de route, refus sur place pour un Visiteur sur `/admin`, lecture et enregistrement en base. Les fixtures, les mentions d'aperçu et `PreviewStates` ont été retirés. Commandes ajoutées ou modifiées : `npm run test:rls` et `npm run test:browser`, qui lisent tous deux `front-end/.env.local` (URL, clé publique et comptes de test, jamais commités). Les tableaux ci-dessous décrivent l'aperçu de la phase 04 et ses preuves historiques. Les comportements et preuves actuels sont dans [IMPLEMENTATION_PLAN](IMPLEMENTATION_PLAN.md) § 10.

## Écrans, App Flow et états réels

| Écran | Parcours dans l’aperçu accepté | Raccordement cible |
| --- | --- | --- |
| E-001 `/login` | Email/mot de passe, affichage/masquage, validation avec focus sur le champ invalide ; saisie valide → indisponibilité explicite, aucune session. Liens vers inscription et météo. | F-002 / US-002 / AC-003–005 : connexion/déconnexion réelles, erreurs fournisseur, perte de session et retrait de l’accès privé. |
| E-002 `/register` | Email/mot de passe, validation, lien connexion ; aucune création de compte ni rôle. Mot de passe provisoire de 8 caractères minimum. | F-001 / US-001 / AC-001–002 : inscription Visiteur, session immédiate sans confirmation email, doublon/refus contrôlé. |
| E-003 `/weather` | Sélecteur et trois cartes cliquables synchronisés ; température, conditions et humidité ; prévisualisation explicite de chargement/erreur/vide, retour aux fixtures. | F-004 / US-004 / AC-009–010 : données Supabase, erreurs/absence réelles et accès authentifié. |
| E-004 `/admin` | Sélection de ville, brouillon local sur trois champs, aperçu, validation et réinitialisation ; enregistrement désactivé. Brouillon perdu au changement de ville/page ou à l’actualisation ; consultation météo inchangée. | F-005–006 / US-005–006 / AC-011–015 : accès Manager, refus d’accès direct Visiteur, écriture et persistance. |

Navigation commune vers météo, administration marquée « Aperçu » et compte. Connexion ↔ inscription ; retour à la météo. `/` et les routes inconnues redirigent vers `/weather`. Les quatre routes sont publiques dans l’aperçu fictif ; aucune donnée privée ni autorisation réelle n’y figure.

Parcours cible validé : non-connecté → inscription/connexion → session Visiteur ou Manager ; Visiteur → météo ; Manager → météo et administration → sauvegarde ; déconnexion → plus d’accès privé. F-003 / US-003 / AC-006–008 exigent des contrôles réels côté données, encore absents. Aucun mécanisme de redirection de connexion ni nouvelle page de refus n’est spécifié ici.

## Où reprendre

| Emplacement réel | Responsabilité |
| --- | --- |
| `front-end/src/App.jsx` | Routes, header, navigation, bannière d’aperçu, titre et focus après navigation |
| `front-end/src/pages/AuthPage.jsx` | Formulaires connexion/inscription ; aucune opération Auth |
| `front-end/src/pages/WeatherPage.jsx` | Sélection de ville et états visuels explicites |
| `front-end/src/pages/AdminPage.jsx` | Brouillon non persistant, validation et aperçu |
| `front-end/src/components/ui.jsx` | Bouton (dont loading), champs, messages, sélecteur et états météo |
| `front-end/src/components/WeatherCard.jsx`, `Icons.jsx` | Cartes et icônes SVG réutilisables |
| `front-end/src/styles.css` | Tokens et styles responsive ; bleu ciel, bleu nuit, cartes claires, ombres douces, polices système, réduction du mouvement |
| `front-end/src/data/weather.js` | Fixtures Paris/Lyon/Marseille, quatre conditions et correspondance icônes |
| `front-end/src/validation.js` | Validations locales ; à compléter par la validation côté données |
| `front-end/tests/` | Tests existants ; ni API ni politiques Supabase testées |

Remplacer les fixtures par l’accès aux données réel dans un lot autorisé, sans modifier la référence HTML ni reconstruire les composants validés. Retirer/adapter les avertissements d’indisponibilité seulement lorsque la fonctionnalité correspondante fonctionne réellement. Aucun rôle/session fictif dans localStorage, aucune requête ou attente réseau simulée.

## Commandes disponibles

Depuis la racine du dépôt, Git Bash :

```bash
cd front-end
npm ci
npm run dev
```

`npm ci` seulement si les dépendances sont absentes ou doivent être réalignées sur le lockfile. Node testé : 24.21.0. Dans PowerShell, utiliser `npm.cmd` si la stratégie d’exécution bloque `npm.ps1`.

Vite écoute sur `http://127.0.0.1:5173/weather`, strictPort activé. Si le port est occupé, vérifier/réutiliser le serveur existant ; ne pas arrêter un processus inconnu. `npm run dev -- --port 5174` permet une consultation sur 5174, mais **le script navigateur existant cible 5173 en dur**. Les liens locaux ne sont pas des URL de livraison accessibles à d’autres machines.

## Preuves établies et validité

Base publiée : [commit 2dce94c — initial commit](https://github.com/tiwosh-cyber/meteo-test/commit/2dce94c1cbc27421855504e56517c3b1d0d0648d). Arbres Git de ce commit :

- `front-end/` : `a3cbd7ba211c36e706143b6d1b77c42850c02f48`.
- `design-preview/` : `99736636457f83f6871d360b993b1b5275b5efdb`.

Résultats observés pendant la réalisation Codex le 15/11/2026, repris en phase 04 Notion. Aucun changement de code depuis cette base au contrôle initial de passation ; les tests ne sont donc pas rejoués pour cette modification documentaire.

| Commande depuis `front-end/` | Résultat constaté | Périmètre / preuve conservée |
| --- | --- | --- |
| `npm run build` | Réussi, Vite 8.3.8, 101 modules transformés | Build de production généré dans `dist/`, ignoré par Git ; résultat historique, pas nouveau build en phase 06. |
| `npm test` | 3 tests réussis, 0 échec | `tests/validation.test.js` : email/mot de passe et météo ; `tests/contrast.test.js` : sept couples texte/fond ≥ 4,5:1. Ne prouve pas la conformité accessibilité complète ni les critères Auth/backend. |
| `npm run test:browser` | Réussi sous Chrome, console sans erreur/avertissement capturé | `tests/browser.mjs` : quatre routes ; 320/390/768/1024/1440 px sans débordement horizontal ; labels, focus visible via Tab, trois villes, cartes, états visuels, erreurs auth/masquage, brouillon admin, reset/changement de ville, absence de persistance et réduction du mouvement. |

Captures desktop/mobile inspectées pendant la réalisation ; fichiers temporaires hors dépôt, non transportables ni garantis disponibles. Les preuves durables sont ce relevé daté, les scripts rejouables et le commit, pas un dossier de captures versionné ou un rapport CI inexistant.

Le script navigateur nécessite Vite actif sur 5173 et Chromium détectable ou `CHROME_PATH` défini ; il utilise un profil temporaire et `--no-sandbox`. Le réserver à l’application locale de confiance. Les contrôles de focus/labels sont des vérifications ciblées, pas une validation de tout le parcours clavier par lecteur d’écran.

Réutiliser ces preuves tant que code, dépendances/configuration et environnement pertinent restent compatibles ; après intégration Auth/RLS, les assertions d’aperçu devront évoluer vers les comportements réels sans les supprimer pour masquer une régression. Des tests de droits/persistance deviennent alors nécessaires.

## Limites et suite

Non vérifiés : lint (aucun script dédié), lecteurs d’écran/audit complet d’accessibilité, Safari/Firefox, appareils physiques, services distants, audit de secrets/historique, dépendances, paramètres d’autodéploiement et production. Contrôle de types non applicable au projet JavaScript. Graphify absent lors de la réalisation et de la préparation ; mise à jour du graphe indisponible.

Pas de succès réel d’inscription/connexion, de déconnexion, de rôle Manager, de contrôle RLS ou de sauvegarde. Les tests locaux rattachés à AC-002/004/013 ne prouvent que des validations de saisie. AC-009/010 sont couverts dans l’aperçu ; aucun des quinze critères n’est déclaré entièrement vérifié sur la cible Supabase.

Travaux restants : Auth/session, source de rôle protégée et Manager séparé, accès privé réel, PostgreSQL/RLS, persistance, validation côté données, tests négatifs et enregistrements après actualisation. Voir [PRD](PRD.md) et [ARCHITECTURE](ARCHITECTURE.md). Aucun plan détaillé de phase 07, schéma SQL, contrat API, commit, push ou déploiement ajouté par cette passation.
