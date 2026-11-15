# DATA — [Nom du projet] · V4 (proposition finale)

> **Créer seulement** si le projet a des données persistantes ou des fichiers à protéger. Stack validée en phase 03 ; ne pas imposer SQL, Supabase ou Docker.
> **Frontières :** schéma, droits, RLS/Rules, migrations, fonctions SQL et stockage → ici ; routes et clés serveur → `BACKEND.md` ; risques globaux → `SECURITY.md` ; outils/CI de test → `TESTING.md` ; infrastructure → `DEPLOYMENT.md` ; durées et obligations décidées → `docs/` / `PRE-DEPLOIEMENT.md` (leur application technique → ici).
> **Méthode :** renseigner §1–2 avant de créer les données ; actualiser états et preuves aux jalons utiles. Si rôle, droit, propriétaire ou règle métier manque : **ne pas inventer ; demander une décision**.

## 1. Périmètre
- **Stack / environnements :** [choix validé ; développement distinct de production, Supabase Cloud dev si retenu]
- **Données nécessaires :** [entités/collections, finalité ; aucune donnée superflue]
- **Identité / périmètre :** [public, utilisateur, organisation ; source fiable des rôles]
- **Champs privilégiés :** [rôle, plan, crédits, propriétaire, organisation, statut ; qui peut les écrire]
- **Conservation / suppression :** [durées validées dans `docs/` ; suppression logique/physique]
- **Hors périmètre :** [tables, buckets, synchronisations à ne pas créer]

## 2. Inventaire des données et droits
| Ressource | Champs / relations / contraintes | Propriétaire et champs protégés | Lire / créer / modifier / supprimer | Conservation | État |
|---|---|---|---|---|---|
| [table, collection, bucket] | [PK, FK, UNIQUE, CHECK ou équivalents NoSQL] | [user/org ; rôle, crédits, etc.] | [qui, sur quelles lignes et colonnes] | [durée validée] | [prévu / implémenté / testé] |

## 3. Dix règles d'implémentation
1. **Minimalisme et intégrité :** modèles, types, contraintes et suppressions cohérents ; les contrôles frontend ne sécurisent jamais les données.
2. **Identité / colonnes :** tirer `user_id`, `org_id`, rôle et droits d'une source serveur protégée, jamais d'un champ client ou `user_metadata`. RLS = lignes, **pas colonnes**. Sur `INSERT`/`UPDATE`, protéger `role`, `plan`, `credits`, propriétaire et statut : d'abord retirer les droits de table des rôles clients (et vérifier `PUBLIC`/héritages), puis accorder seulement les colonnes autorisées ; ou utiliser trigger, table séparée ou règle NoSQL équivalente.
3. **Refus par défaut :** contrôler lecture, création, modification et suppression par ressource et périmètre. Les listes ne doivent révéler aucune donnée d'autrui ; ne jamais compter sur un filtre frontend.
4. **SQL exposé :** toute table d'un schéma exposé à une API (dont Supabase, **même si l'application utilise seulement le serveur**) exige RLS activée et privilèges `GRANT` restrictifs, ou la suppression de son exposition. Définir `USING`/`WITH CHECK` par opération. Pour PostgreSQL accessible uniquement au serveur : rôle applicatif sans superuser, `BYPASSRLS` ni propriété des tables, distinct du rôle de migration ; permissions métier vérifiées dans le backend.
5. **Vues / fonctions :** vue exposée avec `security_invoker = true` (PostgreSQL 15+) ou non exposée. Retirer `EXECUTE` à `PUBLIC`/rôles non autorisés, puis accorder explicitement. Préférer `SECURITY INVOKER` ; sinon sécuriser `SECURITY DEFINER` (`search_path` sûr, noms qualifiés, autorisation interne). Si une politique RLS consulte une table d'appartenance elle-même protégée, éviter la récursion via une fonction dédiée sécurisée.
6. **Migrations :** versionner schémas, index, droits, RLS/Rules, fonctions et stockage ; retranscrire toute modification faite en console. Rejouer sur base locale ou **environnement de développement jetable**, jamais sur production. Avant tout reset distant destructif, vérifier l'identifiant de la cible et obtenir l'accord explicite ; **Docker non imposé**. Toute migration destructive ou modification en production exige une analyse d'impact, une sauvegarde ou un retour arrière possible, puis un accord explicite.
7. **Concurrence :** appliquer en base les invariants (`CHECK`, `UNIQUE`, transaction/verrou, `UPDATE` atomique) pour empêcher soldes négatifs, doubles effets ou écritures incohérentes ; orchestration API → `BACKEND.md`.
8. **Exposition / performances :** ne pas exposer les champs internes via liste, vue ou fonction ; index uniquement justifiés par les requêtes. Si temps réel : contrôler l'autorisation des canaux, y compris Broadcast/Presence privés si utilisés.
9. **Cycle de vie :** appliquer les durées décidées, masquer les suppressions logiques, purger/anonymiser selon accord, gérer les fichiers liés et les limites des sauvegardes. Pas de copie de production en dev sans anonymisation ; secrets tiers stockés uniquement si nécessaires, chiffrés/coffre et accès restreint.
10. **Stockage :** fixer les permissions de liste, lecture, création, remplacement et suppression pour chaque bucket/chemin ; fichiers privés via accès autorisé ou URL signée courte ; bucket public = fichiers publics. Si upload serveur, contrôler type, taille et nom côté serveur (`BACKEND.md`).

## 4. Déclencheurs par stack
- **Supabase (navigateur ou serveur seul) :** contrôler schémas API exposés, RLS + `GRANT`, claims fiables (`app_metadata`/table protégée), opérations `service_role` distinctes et alertes Security Advisors. Ne pas assimiler un appel SQL admin à un test RLS.
- **Firebase / Firestore / Storage :** versionner `firestore.rules` et `storage.rules` ; refus par défaut, aucune règle « test » ouverte en production ; limiter les champs (`keys().hasOnly`, `diff().affectedKeys().hasOnly`). Les Rules ne filtrent pas les requêtes et le SDK Admin les contourne : sécuriser le serveur et tester en émulateur.
- **Multi-organisations :** tester l'isolation entre organisations et l'impossibilité de s'auto-attribuer des droits ; **N/A** si non concerné.

## 5. Tests et preuves
- **Exécution réelle :** [commandes/actions, succès/échec, preuve]. Tester RLS/Rules avec de vrais clients/jetons anonymes et utilisateurs ; **pas** avec SQL Editor, `postgres`, propriétaire, MCP SQL admin, `service_role` ou Firebase Admin. Une simulation SQL des rôles complète mais ne remplace pas un test client.
| Scénario | Résultat attendu | État / preuve |
|---|---|---|
| Anonyme lit ou écrit une ressource privée | Refus, aucune fuite | [non testé / preuve] |
| Utilisateur A lit/modifie la ressource B par ID | Refus, aucun effet | [non testé / preuve] |
| A liste les données ; A accède à l'organisation B (si multi-org) | Seulement son périmètre / refus | [non testé / N/A / preuve] |
| A crée ou modifie ses propres champs `role`, `plan`, `credits`, `owner_id`, `org_id` | Refus ou état protégé inchangé | [non testé / preuve] |
| Anonyme/tiers appelle une vue ou fonction exposée | Aucune donnée/opération non autorisée | [N/A / preuve] |
| Contrainte, concurrence, doublon, suppression logique (si concernés) | Intégrité maintenue, aucun double effet | [N/A / preuve] |
| Fichier privé d'un tiers ou URL expirée (si stockage) | Accès refusé | [N/A / preuve] |
| Migration sur base dev jetable / Rules dans l'émulateur | Résultat reproductible, sans toucher à prod | [N/A / preuve] |
| Security Advisors ou contrôle automatique équivalent (si disponible) | Alertes analysées ; risques signalés/corrigés | [N/A / preuve] |

**Règle finale :** `prévu` ≠ `implémenté` ≠ `testé`. Ne déclarer « sécurisé » qu'avec des preuves ; retirer les lignes non applicables, sans ajouter d'architecture ou de documents inutiles.
