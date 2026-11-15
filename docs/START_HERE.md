# METEO TEST — Reprendre le projet

Passation préparée le 15/11/2026, à faire approuver. Phases 01–05 validées ; contrôle 05 : **GO AVEC RÉSERVES**, sans autorisation de production. Aucun lancement de phase 07–08 par cette préparation.

Le frontend React/Vite et ses quatre écrans sont acceptés. Le code reste dans `front-end/` ; `design-preview/` reste intact. Phase 08, lot 1 (15/11/2026, branche `phase-08-supabase`, non commitée) : Supabase Auth, rôle Manager, RLS et persistance sont implémentés et testés sur le projet de test. Le lot attend la revue humaine. État et preuves : [IMPLEMENTATION_PLAN](IMPLEMENTATION_PLAN.md).

## Ordre de lecture

1. [AGENTS.md](../AGENTS.md) : règles universelles et sources opérationnelles.
2. [PRD.md](PRD.md) : produit, périmètre et F/US/AC stables.
3. [ARCHITECTURE.md](ARCHITECTURE.md) : choix validés, cible et décisions encore ouvertes.
4. [FRONTEND.md](FRONTEND.md) : passation Codex, parcours, commandes, preuves et raccordements.

Modèles utiles copiés, non encore renseignés : [DATA](DATA.md), [SECURITY](SECURITY.md), [TESTING](TESTING.md). Les modèles génériques ne remplacent pas les décisions de ces documents.

## Reprise

Vérifier `git status` et le code avant d’agir. Base de cette passation : [commit 2dce94c](https://github.com/tiwosh-cyber/meteo-test/commit/2dce94c1cbc27421855504e56517c3b1d0d0648d), branche `main`. Dépôt public accepté pour ce test, sans secrets ni données sensibles.

La suite attendue, une fois autorisée : planifier puis raccorder Supabase Auth/PostgreSQL/RLS aux écrans existants, tester droits et persistance. Pas de refonte, faux backend ou création de service par cette passation. Les tests frontend encore valides sont réutilisés.

Après la passation, le dépôt est la référence opérationnelle ; Notion conserve les décisions initiales et le suivi. **Phases 07–08 : reprise autonome depuis le dépôt, sans connexion à Notion.**

Source initiale : [projet Notion METEO TEST](https://app.notion.com/p/419282ff070c8033ba03e3a24b2cd7a3). Page [06 — Passation Markdown](https://app.notion.com/p/419282ff070c80448178dfdc7d213e26) à actualiser uniquement après accord humain et instruction. Aucune écriture Notion effectuée pendant cette préparation.
