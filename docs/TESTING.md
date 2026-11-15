# TESTING — [Nom du projet] · V2 (contre-expertise)

> **Utilisation :** vérifier l'essentiel selon le risque et l'existant, sans répéter les tests déjà prouvés. Ne créer `docs/TESTING.md` que si nécessaire ; sinon consigner la passation dans un fichier existant du dépôt (ex. README), jamais seulement dans une conversation ou une PR.
> **Frontières :** scénarios métier/API → `BACKEND.md` ; RLS/Rules, migrations, stockage → `DATA.md` ; gravité et NO GO → `SECURITY.md` ; contrôles UI déjà réalisés → `FRONTEND.md` ; **vérifications obligatoires et commandes → ici ; configuration CI, mise en ligne et smoke test post-déploiement → `DEPLOYMENT.md`** ; audit final/accord humain → `PRE-DEPLOIEMENT.md`.
> **Principe :** lire le code, les décisions validées et les preuves existantes. États : **prévu / implémenté / testé** ; si non exécuté, préciser **non vérifié**. Aucun test décoratif.

## 1. Périmètre et priorité
- **Stack, outils et commandes disponibles :** [framework, scripts, runner, environnement].
- **Parcours critiques :** [selon les exigences réellement validées : connexion, formulaire, paiement, vote…].
- **Risques prioritaires :** [droits, argent, données privées, actions irréversibles, services externes].
- **Preuves réutilisables :** [commande + environnement + commit ou date + résultat + emplacement].
- **Hors périmètre :** [fonctions absentes ou déjà vérifiées avec preuve encore valable].

## 2. Plan minimal (si suivi utile)
| Parcours / risque | Test adapté | Attendu | Commande / preuve | État |
|---|---|---|---|---|
| [fonction] | [statique / unitaire / intégration / E2E / manuel] | [résultat observable] | [commande réelle ou à faire] | [prévu / implémenté / testé] |

## 3. Dix règles d'exécution
1. **Preuves et régressions :** réutiliser les résultats Codex/autres agents si commande, environnement, commit ou date et résultat sont connus ; preuve périmée si code concerné, migrations, politiques, dépendances ou configuration ont changé. Retester la zone touchée et ses dépendances pertinentes.
2. **Priorité au risque :** cibler parcours métier, autorisations, données et effets coûteux. Conserver les scénarios **critiques rejouables** (accès croisés, colonnes privilégiées, paiement/idempotence si présents) en tests automatisés avec l'outil existant, ou un outil léger approuvé si nécessaire. Aucun pourcentage de couverture imposé.
3. **Niveaux proportionnés :** lint, types et build si disponibles ; unitaires pour règles/calculs ; intégration pour API/base/services ; E2E seulement pour parcours critiques où il apporte une preuve, sur **build de production** si pertinent.
4. **Résultats objectifs :** tester les décisions produit validées avec entrée, action et résultat observables. Exigence absente ou contradictoire → demander une décision, ne pas inventer ni affaiblir les critères.
5. **Cas négatifs :** accès refusés, données invalides, erreurs, expiration et concurrence selon les fonctions réellement présentes ; reprendre les cas de `BACKEND.md` et `DATA.md` sans doubler leurs documents.
6. **Fiabilité :** jeux de test reproductibles et isolés (comptes A/B, organisations si besoin), sans vrais secrets ni données personnelles ; tests indépendants, assertions utiles, pas de mocks masquant la logique critique. Secrets CI dans le coffre de la plateforme.
7. **Services externes :** sandbox, émulateur ou doublure contrôlée ; distinguer simulation et intégration réelle. Aucun paiement réel, envoi massif ou appel payant non autorisé.
8. **Environnements sûrs :** dev/test par défaut ; aucune écriture, suppression ou réinitialisation en production sans accord explicite. Ne pas recopier de données de production sans anonymisation.
9. **Exécution économe et honnête :** tests ciblés d'abord, suite complète pertinente une fois avant passation ; conserver les erreurs utiles, pas les logs entiers. Test instable après deux échecs → signaler, pas de boucle. Si navigateur, appareil ou service indisponible : **non vérifié**, jamais « réussi » par supposition.
10. **Ne pas contourner un échec :** pas de `.skip`, suppression de test, assertion affaiblie ou timeout augmenté pour « faire passer » sans décision humaine. Échec critique → corriger et retester ou **NO GO** selon `SECURITY.md`.

## 4. Déclencheurs selon le projet
- **Site statique :** build, liens et formulaires éventuels ; reprendre les vérifications UI déjà établies. Ne pas ajouter de framework de tests sans bénéfice.
- **Auth / données :** rejouer les tests sensibles de `BACKEND.md` / `DATA.md` si leurs preuves sont périmées ; privilégier des tests automatisés reproductibles.
- **Paiement / quotas / jobs / IA :** scénarios d'échec, doublon, coût ou permissions propres à la fonction, uniquement si elle existe ; se référer à `BACKEND.md` / `SECURITY.md`.

## 5. Bilan et passation
- **Lieu :** [README ou document existant du dépôt ; `docs/TESTING.md` seulement si suivi indispensable].
- **Tests exécutés :** [commande + environnement + commit/date + résultat réel + emplacement de la preuve].
- **Non vérifié / échecs :** [raison, risque, action nécessaire et responsable].
- **Décision :** [suffisant / réserves / NO GO] ; **aucune mise en production sans accord humain explicite**.

**Phase 09 :** réutiliser les preuves encore valables, relancer seulement les tests pertinents rendus nécessaires par les changements et effectuer l'audit `PRE-DEPLOIEMENT.md`. L'acceptation humaine reste obligatoire.
