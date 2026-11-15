# METEO TEST — Instructions communes à tous les agents

Ces règles s’appliquent aux agents locaux, cloud et routeurs ayant accès au dépôt. Aucun agent particulier n’est requis pour reprendre le travail.

## Commencer par l’existant

1. Vérifier le répertoire de travail, la branche, le commit et les changements locaux (`git status`, `git log -1`). Ne pas écraser le travail humain.
2. Lire [docs/START_HERE.md](docs/START_HERE.md), puis seulement les documents et fichiers utiles à la demande. Comparer les décisions au code avant d’agir ; une documentation n’est pas une preuve d’implémentation.
3. Conserver la structure native : application dans `front-end/`, code dans `front-end/src/`, tests dans `front-end/tests/`. Ne pas déplacer/recréer l’application, imposer de dossiers techniques numérotés ou changer de stack.
4. `design-preview/` est la référence graphique validée : ne jamais le modifier, le déplacer ni le remplacer. Les quatre écrans React sont acceptés ; réutiliser composants, styles et validations existants. Pas de nouvelle construction frontend par défaut.

## Références opérationnelles

Après cette passation, le dépôt (`AGENTS.md`, `docs/`, code et preuves) est la référence opérationnelle. Notion conserve les décisions initiales et le suivi. Pendant les phases 07–08, travailler depuis le dépôt sans connexion à Notion. Si une décision indispensable manque, la demander à l’humain sans inventer une spécification ni consulter Notion en contournant cette règle.

| Document | Usage |
| --- | --- |
| [START_HERE](docs/START_HERE.md) | État, ordre de lecture et limites de la passation |
| [PRD](docs/PRD.md) | Produit, rôles, références F/US/AC et exclusions |
| [ARCHITECTURE](docs/ARCHITECTURE.md) | Réalisé, cible validée, arbitrages et points ouverts |
| [FRONTEND](docs/FRONTEND.md) | Livraison Codex, écrans/parcours, commandes et preuves réutilisables |
| [DATA](docs/DATA.md) | Modèle à appliquer aux données, droits, RLS et migrations |
| [SECURITY](docs/SECURITY.md) | Modèle pour Auth, privilèges, secrets et risques |
| [TESTING](docs/TESTING.md) | Modèle pour préparer les vérifications manquantes sans refaire les preuves valides |

Les trois derniers fichiers sont des copies exactes de modèles techniques non renseignés pour ce projet. Leurs exemples, champs à compléter et mentions d’autres modèles ne constituent ni schéma validé, ni contrat API, ni preuve de tests. Appliquer uniquement les règles pertinentes, en conservant les décisions produit spécifiques documentées ici. Ne pas créer de fichiers pour remplir un modèle.

## Boîte à outils et copies transportables

Source locale vérifiée lors de la préparation : `C:/Users/pierr/Documents/PROJET LOCAL/BOITES-A-OUTILS/templates/` (soit `Documents/PROJET LOCAL/BOITES-A-OUTILS/templates/`). Les copies dans `docs/` sont prioritaires et accessibles à tout agent disposant du dépôt, même sans accès à ce disque Windows.

| Modèle de la boîte à outils | Décision pour cette passation |
| --- | --- |
| `FRONTEND.md` | Concerne le travail de phase 04 déjà livré et validé. Pas de nouvelle construction ; `docs/FRONTEND.md` est la passation du frontend réel, pas une copie du modèle. |
| `DATA.md` | Copié dans `docs/DATA.md` : PostgreSQL, RLS, persistance et migrations à préparer. |
| `SECURITY.md` | Copié dans `docs/SECURITY.md` : Auth, Manager, secrets et dépôt public. |
| `TESTING.md` | Copié dans `docs/TESTING.md` : critères backend et tests de droits/persistance manquants. |
| `BACKEND.md` | Non copié : Supabase BaaS sans code serveur spécifique ; aucun serveur Node, webhook, job ou Edge Function retenu. |
| `DEPLOYMENT.md` | Non copié : aucune livraison plateforme autorisée à ce stade. |
| `PRE-DEPLOIEMENT.md` | Non copié : audit final et GO de publication ultérieurs. |

Si le plan révèle le besoin d’un modèle supplémentaire, l’importer en phase 08 seulement, selon le périmètre autorisé. Vérifier l’existence de la source et la copie ; pour un agent sans accès local, demander à l’humain le fichier nécessaire, sans prétendre l’avoir copié. Ne jamais importer les sept systématiquement.

## Modifications et vérifications

- Petites corrections nécessaires au lot demandé autorisées : préserver comportement, erreurs, validations, accessibilité et références F/US/AC/E. Refonte importante du design, des parcours, de la structure ou de l’architecture seulement après accord humain explicite.
- Préférer la plus petite correction complète, les composants existants et les dépendances déjà installées. Ne pas ajouter de page, rôle, abstraction, service ou dépendance sans besoin réel.
- Réutiliser les résultats de [docs/FRONTEND.md](docs/FRONTEND.md) tant que code concerné, dépendances, configuration et environnement pertinent n’ont pas changé. Ne pas relancer systématiquement build et tests sur un simple changement documentaire.
- Après un changement fonctionnel, tester la zone touchée et ses dépendances pertinentes. Ne pas masquer un échec, désactiver un test ou affaiblir un critère pour faire passer la suite.
- Consigner preuves et limites dans le dépôt : commande/action réelle, environnement, commit ou date, résultat, périmètre et non-vérifié. Distinguer prévu, implémenté, testé et accepté par l’humain. Les noms des tests ne prouvent pas les critères backend.

## Sécurité et autorisations

- Aucun faux compte, rôle Manager, session ou succès métier. L’administration actuelle est un aperçu public sans autorisation réelle ni sauvegarde ; elle ne prouve pas que l’application cible est sécurisée.
- Supabase Auth et les protections PostgreSQL/RLS restent à implémenter. Le rôle Manager doit venir d’une source protégée côté fournisseur/base, jamais d’un champ client modifiable ou d’un rôle fictif dans localStorage. Tester les refus avec de vrais contextes anonymes/Visiteur/Manager ; un appel SQL admin ne prouve pas la RLS.
- Inscription libre en Visiteur et session sans confirmation email : choix accepté pour ce test. Ne pas changer ce choix sans décision humaine ; signaler le risque de l’adresse non vérifiée. Manager créé séparément par une opération administrative sûre.
- Dépôt public accepté pour ce test. Aucun secret, mot de passe, jeton, clé privée ou donnée sensible dans Git, docs, captures, logs ou bundle. Variables Vite publiques = visibles dans le navigateur ; aucune clé `service_role`/admin côté client. Ne pas afficher de valeurs secrètes lors des contrôles.
- Refus par défaut des ressources privées dans la cible ; validation des valeurs et droits côté données, pas seulement dans l’interface. Pas d’API météo externe, serveur Node, Docker, stockage de fichiers ou autre service ajouté par défaut.
- Dev/test par défaut ; vérifier la cible réelle avant toute écriture distante. Migrations destructives, reset distant, suppressions de données et écritures en production : analyse d’impact, sauvegarde/retour arrière adapté et GO humain pour l’action précise. Pas de raccourci de sécurité pour gagner du temps.

## Jalons humains et publication

- Phases 01–05 validées ; phase 05 : GO AVEC RÉSERVES. Cette passation est préparée pour revue, pas automatiquement validée.
- Ne pas lancer les phases suivantes sans demande. Après accord humain et instruction, actualiser uniquement la page 06 Notion et son statut ; pas de mise à jour implicite des autres phases.
- Aucun commit/push, fusion, création de service ou déploiement dans cette préparation. Pour la suite, respecter l’autorisation de la demande active et privilégier une branche de travail sûre.
- La validation d’une phase ou un commit n’est jamais un GO de production. Identifier l’autodéploiement avant un push, une fusion ou une promotion qui pourrait publier ; accord humain explicite obligatoire pour toute publication, y compris indirecte.

## graphify

Instructions conservées du projet ; aucun graphe présent et commande indisponible lors de cette préparation. Ne pas installer l’outil par défaut.

- Quand l’utilisateur tape `/graphify`, consulter le skill ou les instructions graphify installés avant toute autre action.
- Si `graphify-out/graph.json` existe, exécuter `graphify query "<question>"` avant le premier grep, recherche ou lecture de source pour une question sur le code. Inclure cette règle dans tout prompt de sous-agent explorant le code, si une délégation est autorisée.
- Lire les sources brutes seulement pour les lignes déjà localisées par le graphe ou une lecture antérieure. Utiliser `graphify path "<A>" "<B>"` pour les relations et `graphify explain "<concept>"` pour un concept ciblé.
- Les fichiers graphify sales sont attendus après les hooks/mises à jour ; ce n’est pas une raison de sauter graphify. Exceptions : demande portant sur un graphe périmé/incorrect, ou instruction explicite de ne pas l’utiliser. Si l’outil échoue, signaler la limite au lieu de prétendre l’avoir utilisé.
- Si `graphify-out/wiki/index.md` existe, l’utiliser pour la navigation large. Réserver `graphify-out/GRAPH_REPORT.md` à la revue d’architecture large ou lorsque les requêtes ciblées ne suffisent pas.
- Après modification de code, exécuter `graphify update .` (AST uniquement, sans coût API). Si indisponible, documenter la limite.
- Un `graphify-out/graph.json` versionné est réécrit entièrement : un gros diff est attendu, ne pas le présenter comme du churn ni suggérer de sauter la reconstruction ou les hooks.
