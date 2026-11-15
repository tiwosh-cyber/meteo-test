# METEO TEST — Architecture et réserves

Décisions de [phase 03](https://app.notion.com/p/419282ff070c801487edf4776f68f677), corrigées/confirmées par le [contrôle 05](https://app.notion.com/p/419282ff070c80299842d5f47c15c31f), consultées le 15/11/2026. Pas de nouvelle spécification technique créée ici.

## Réalisé dans le dépôt

- `design-preview/` : HTML/CSS/JavaScript autonome, référence graphique validée et intangible.
- `front-end/` : React + Vite + JavaScript, React Router ; pages dans `src/pages/`, composants dans `src/components/`, variables CSS dans `src/styles.css`, fixtures isolées dans `src/data/weather.js`.
- `front-end/tests/` : tests Node natifs et parcours navigateur via Chromium. Aucun framework de tests supplémentaire.
- Phase 08, lot 1 : client Supabase (`front-end/src/supabase.js`), migration `supabase/migrations/20261115000000_init.sql` (tables `weather` et `managers`, `is_manager()`, RLS) et sessions réelles. Le tout est testé sur le projet de test ; voir [IMPLEMENTATION_PLAN](IMPLEMENTATION_PLAN.md). Variables publiques : `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`, dans `front-end/.env.local` (ignoré par Git).
- [Dépôt GitHub](https://github.com/tiwosh-cyber/meteo-test), `main`, base `2dce94c1cbc27421855504e56517c3b1d0d0648d`. Commit/push initial faits par l’utilisateur. Dépôt public accepté expressément en phase 05 pour le test, sans secrets/données sensibles.

Le choix historique de génération via v0 a été remplacé par Codex local : référence HTML d’abord, puis conversion React après validation. Ne pas recommencer la construction frontend.

## Cible validée — non implémentée

| Besoin | Décision et justification |
| --- | --- |
| Authentification | Supabase Auth email/mot de passe, session immédiate sans confirmation email ; déconnexion réelle. |
| Données | PostgreSQL dans Supabase Cloud pour les trois villes et les trois valeurs météo. Données modifiables par le Manager, persistantes. |
| Autorisations | Identité authentifiée et source de rôle protégée côté fournisseur/base ; RLS et privilèges adaptés. Visiteur = lecture, Manager = lecture/modification ; non-connecté = refus des ressources privées. |
| Attribution Manager | Opération administrative sûre séparée de l’inscription ; jamais un champ client modifiable. |
| Infrastructure | Un seul projet Supabase Cloud de test au départ, sans base locale ni Docker. Pas de serveur Node dédié ni de code serveur spécifique décidé. |
| Hébergement | Vercel Hobby Free prévu pour le frontend personnel non commercial ; sous-domaine hébergeur, domaine personnalisé facultatif. Aucun déploiement effectué dans cette livraison Codex. |

Ce sont les offres retenues au cadrage, pas une garantie de gratuité ou de quotas actuels. Cible 0 €/mois sous réserve des limites ; ne pas créer de service payant ni ajouter un environnement par défaut.

L’accès aux données reposera sur les services Supabase retenus. Aucun nom de table, route API, fonction SQL, format d’erreur ou variable d’environnement n’est décidé par cette passation. Les préciser à partir des besoins et du code lors du plan/lot autorisé, sans inventer une couche serveur.

## Sécurité et exploitation à préserver

- RLS et validation côté données doivent refuser les lectures/écritures non autorisées ; protéger aussi les champs privilégiés. Un guard React seul est insuffisant.
- Aucun `service_role`, secret admin, mot de passe ou jeton dans le navigateur, Git ou docs. Un préfixe Vite public n’est jamais un coffre de secrets.
- Ne pas traiter un rôle provenant de l’interface ou de métadonnées modifiables par l’utilisateur comme une autorisation.
- Tester directement avec des identités anonymes, Visiteur et Manager ; ne pas confondre succès d’un accès admin avec validation des politiques RLS.
- L’administration publique de l’aperçu n’autorise aucune gestion réelle et ne doit pas devenir un panneau de production public au raccordement.
- Contrôler les déclencheurs Git/Vercel avant un push ou une fusion pouvant publier. Aucun GO de publication n’est inclus dans les validations 01–05.
- Un seul projet de données peut être partagé par previews et application publiée : risque accepté au cadrage, à vérifier et maîtriser avant livraison. Aucune opération destructive distante sans cible vérifiée et accord précis.

## Réserves et décisions encore nécessaires

1. Projet Supabase réel, propriétaire, accès et paramètres effectifs : non configurés/vérifiés dans cette livraison. Ne jamais copier des secrets dans la documentation.
2. Schéma minimal, stockage protégé du rôle et méthode de création du Manager : à définir et tester ; pas de solution technique présupposée.
3. Règles Auth finales : conserver le choix sans confirmation email, aligner les validations frontend avec le fournisseur. Les 8 caractères du formulaire d’inscription sont une règle provisoire d’aperçu, pas une configuration Supabase attestée.
4. États réels de session expirée, refus d’accès, chargement/erreur réseau et sauvegarde : à raccorder aux composants existants. Ne pas inventer de nouvelles pages ; une modification importante de parcours nécessite accord.
5. Rétention/suppression des comptes, contrôles anti-abus et configuration de sécurité des plateformes : non décidés/vérifiés ; traiter seulement selon les besoins réels avant exposition.
6. Paramètres Vercel, autodéploiement, URL publiée et éventuel domaine : à préparer ultérieurement ; aucune URL de production à annoncer.
7. Audit complet d’accessibilité, autres navigateurs et tests Auth/RLS/persistance : encore sans preuve. [Preuves frontend réutilisables](FRONTEND.md).

Modèles à utiliser pour ces travaux : [DATA](DATA.md), [SECURITY](SECURITY.md), [TESTING](TESTING.md). Copies génériques, non renseignées ; elles n’attestent aucune mise en œuvre. `BACKEND.md` n’est pas importé car son propre périmètre exclut le BaaS sans code serveur spécifique. Déploiement et pré-déploiement seront importés en phase 08 si le plan les rend nécessaires.
