# PRE-DEPLOIEMENT — [Nom du projet] · V2 (contre-expertise)

> **Usage :** audit final en phase 09, même pour un site vitrine ; obligations adaptées au pays, au public et aux fonctions réelles. Ne créer ni document ni bandeau inutile.
> **Frontières :** ici = conformité, accessibilité, exposition publique, verdict global ; `SECURITY.md` = risques ; `FRONTEND.md` = corrections UI ; `BACKEND.md`/`DATA.md` = protections ; `TESTING.md` = preuves ; `DEPLOYMENT.md` = CI, sauvegardes, publication et GO humain.
> **Méthode :** réutiliser les preuves encore valables, sans refaire les tests. Vérifier le droit en vigueur et ne jamais inventer de conformité ou d'identité. États : **présent/cohérent, à corriger, non vérifié, non applicable** ; « présent/cohérent » n'est pas une certification juridique.

## 1. Périmètre à confirmer
- **Éditeur, pays et public :** [identité réelle, France/UE/autre, B2B/B2C, mineurs éventuels].
- **Fonctions :** [vitrine, comptes, formulaire, vente, abonnement, paiement, IA, emails, analytics, contenus utilisateurs].
- **Données et prestataires :** [finalités, données, hébergement, sous-traitants, transferts, durées décidées].
- **Références :** [décisions `docs/`, URL, preuves, commit/date et conclusions des autres modèles].

## 2. Contrôle proportionné
| Domaine | Règles | Statut et preuve |
|---|---|---|
| Identité, contrats, vente | 1–2 | [statut, URL, réserve] |
| Vie privée et traceurs | 3–4 | [statut, preuve] |
| Accessibilité | 5 | [statut, preuve] |
| Contenu et visibilité | 6–7 | [statut, URL] |
| Sécurité publique | 8 | [statut, preuve existante] |
| Vérification et décision | 9–10 | [preuves, verdict] |

## 3. Dix règles d'audit
1. **Mentions légales :** vérifier éditeur, contacts, hébergeur et liens accessibles ; ne jamais inventer identité, SIREN, adresse ou statut.
2. **Contrats et consommation :** CGU/CGV, prix, prestations, paiements, factures, médiateur et remboursements selon activité/public. B2C avec contrats à distance conclus sur interface en ligne : si droit de rétractation applicable, fonction gratuite, facile d'accès et disponible pendant son délai (France : depuis le 19/06/2026) ; contrats de consommation résiliables en ligne : fonctionnalité de résiliation applicable. Ne pas ajouter le lien de l'ancienne plateforme européenne RLL (supprimée en 2025).
3. **RGPD :** vérifier traitements réels, finalités, bases légales, information à la collecte, droits, durées, transferts, registre adapté ; contrat art. 28 avec les véritables sous-traitants (y compris rôle de sous-traitant du SaaS B2B). Prévoir le traitement des violations : documenter ; CNIL sous 72 h si risque, personnes informées si risque élevé, sous réserve des exceptions légales.
4. **Cookies/traceurs :** inventorier les scripts ; consentement préalable, refus/retrait aussi simples que l'acceptation quand requis ; vérifier les exemptions. **Pas de bandeau si aucun traceur ne l'exige.**
5. **Accessibilité :** vérifier clavier, focus, formulaires, alternatives, contrastes et mobile (WCAG 2.2 AA comme objectif de qualité). Identifier le régime applicable : accessibilité des services B2C couverts par la directive (UE) 2019/882 depuis le 28/06/2025 (exemption prévue pour les microentreprises prestataires de services), RGAA quand il s'applique ; déclaration si exigée. Ne jamais présumer que tout site privé est soumis au RGAA ; incertitude → décision humaine éclairée.
6. **Pages et contenus :** liens légaux, textes définitifs, langues, droits/licences (images, polices, contenus), scripts tiers ; aucune certification ou promesse inventée.
7. **Visibilité :** titres, métadonnées, canonical, `robots.txt`, sitemap et robots IA selon besoins ; **`noindex`/`robots.txt` ne sécurisent pas** les données privées.
8. **Sécurité même pour un site statique :** HTTPS/en-têtes, aucune clé privée dans le frontend, formulaires protégés des abus, MFA hébergeur/registrar, aucun fichier sensible publié ; réutiliser les contrôles de SECURITY/DEPLOYMENT sans les refaire.
9. **Preuves honnêtes :** conserver URL/fichier, constat, commit/date et responsable dans le dépôt ; « non vérifié » si impossible ; « non applicable » uniquement avec justification.
10. **Verdict consolidé :** **NO GO** si SECURITY, TESTING ou DEPLOYMENT indique NO GO, si risque critique/élevé non maîtrisé ou si obligation applicable non satisfaite ; une réserve ailleurs donne au mieux **GO AVEC RÉSERVES**. Contrôle critique non vérifié : jamais GO sans décision humaine explicite et documentée ; une dérogation humaine n'efface pas une obligation légale. L'audit n'autorise ni merge ni mise en production.

## 4. Déclencheurs uniquement si concernés
- **Plateforme / marketplace / contenus utilisateurs :** évaluer les obligations DSA (contact, signalement, CGU et procédures adaptées) selon le rôle exact du service.
- **IA, marketing et analytics :** vérifier information/transparence IA exigée à la date de l'audit, flux vers prestataires, prospection/désinscription et traceurs ; ne pas dupliquer SECURITY.
- **Mineurs, données sensibles, secteur réglementé, vente internationale :** vérifier règles locales et demander arbitrage juridique humain si nécessaire.

## 5. Verdict et passation
- **Résultat :** [GO / GO AVEC RÉSERVES / NO GO] ; [obligations applicables, bloquants, réserves, preuves, responsable et action].
- **Trace :** bilan court dans README/fichier existant du dépôt ; `docs/PRE-DEPLOIEMENT.md` seulement si réellement utile. Renvois, pas de duplication.
- **Décision :** verdict favorable ≠ permission de publier : **GO humain explicite** selon `DEPLOYMENT.md`. Audit omis uniquement sur décision humaine explicite et tracée, sans supprimer les obligations légales.
