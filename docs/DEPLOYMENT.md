# DEPLOYMENT — [Nom du projet] · V2 (contre-expertise)

> **Utilisation :** livrer et exploiter sur l'hébergement validé en phase 03 ; adapter à l'existant, sans imposer Vercel, VPS, Docker ou CI complexe.
> **Frontières :** tests/commandes exigés → `TESTING.md` ; pipeline, environnements, publication, sauvegarde effective, restauration et smoke test → ici ; secrets/risques → `SECURITY.md` ; données à sauvegarder et règles des migrations → `DATA.md` ; audit et décision de mise en ligne → `PRE-DEPLOIEMENT.md`.
> **Principe :** aucun déploiement en production, y compris indirect, sans **GO humain explicite**. États : **prévu / implémenté / testé** ; non observable = **non vérifié**.

## 1. Cible et contraintes
- **Stack / hébergeur validés :** [site statique, mutualisé, BaaS, serveur ; services réellement utilisés].
- **Branches / environnements :** [dev, preview, prod ; déclencheurs automatiques ; qui peut promouvoir].
- **Commandes / variables :** [build/start ; variables par environnement et leur portée ; aucune valeur secrète dans le document].
- **Domaine / données / coût :** [DNS, HTTPS, base, stockage, email, jobs ; responsable de chaque ressource].
- **Hors périmètre :** [infrastructure non nécessaire].

## 2. Plan minimal de livraison
| Étape | Action réelle | Cible / preuve | État |
|---|---|---|---|
| Préparer | [tests requis, build, audit] | [commit + environnement + résultats] | [prévu / implémenté / testé] |
| Publier | [PR, merge humain ou promotion autorisée] | [cible + statut + URL] | [prévu / implémenté / testé] |
| Vérifier | [HTTPS, parcours essentiel, service] | [URL + date + résultat] | [prévu / implémenté / testé] |
| Revenir en arrière | [version saine ; restauration si nécessaire] | [procédure éprouvée ou non vérifiée] | [prévu / implémenté / testé] |

## 3. Dix règles d'exécution
1. **Existant d'abord :** conserver stack, hébergement et pipeline validés ; ne pas ajouter de VPS, conteneur, staging ou monitoring payant sans besoin.
2. **Isolation réelle :** vérifier la **portée** de chaque variable et connexion par environnement ; une preview ne doit pas utiliser les secrets privilégiés ni écrire dans la base de production. Restreindre l'accès aux previews sensibles ; sinon empêcher leur indexation. Une modification de variable peut nécessiter un nouveau déploiement.
3. **GO humain effectif :** identifier toute branche, PR, commande ou configuration qui déclenche la production. L'agent prépare PR et preuves ; l'humain merge/promeut, sauf **autorisation écrite explicite pour l'action précise**. Si disponible, protéger techniquement la branche ou exiger une promotion manuelle. Aucun push direct sur une cible auto-déployée sans GO.
4. **CI proportionnée :** réutiliser le pipeline ; configurer les vérifications obligatoires définies dans `TESTING.md` et bloquer en cas d'échec significatif. Pas d'infrastructure de test inutile.
5. **Publication sûre :** contrôler cible, commit, build, HTTPS, audit `PRE-DEPLOIEMENT.md` et absence de risque critique/élevé non maîtrisé. Publier **uniquement les artefacts prévus** : jamais `.env`, `.git`, sauvegardes, exports ou sources privées sous la racine web ; secrets hors dossier public. Vérifier ensuite que `/.env` et `/.git/` ne sont pas consultables, sans en afficher le contenu.
6. **Migrations compatibles :** ajouter avant d'utiliser ; supprimer/renommer seulement quand aucune version encore déployée n'en dépend. Une migration destructive ou une modification de production nécessite l'analyse d'impact et le GO prévus dans `DATA.md`. Un rollback de code **ne restaure pas** les données.
7. **Publication tracée :** privilégier une preview si disponible ; noter commit, cible, configuration, décision humaine et méthode de retour arrière. Ne jamais affirmer « déployé » sans statut ou URL vérifié ; ne pas interroger le statut en boucle ni recopier des logs entiers.
8. **Smoke test après publication :** vérifier URL, HTTPS, parcours essentiel et API réellement utilisées, plus les erreurs pertinentes ; ne pas relancer tous les tests déjà prouvés. Après un rollback, vérifier le domaine et la prochaine livraison.
9. **Sauvegarde et reprise effectives :** mettre en place **et vérifier** sauvegarde/restauration des données essentielles définies dans `DATA.md`. Avant une migration destructive : sauvegarde récupérable réellement disponible, ou export vérifié juste avant ; ne pas supposer qu'une offre gratuite en fournit une. Définir la procédure et le responsable de reprise.
10. **Accès et vérité :** droits minimaux/MFA selon `SECURITY.md` ; ne pas exposer de secrets dans les preuves ou journaux. Toute vérification impossible est **non vérifiée** et confiée explicitement à l'humain.

## 4. Déclencheurs selon le projet
- **Mutualisé / FTP / SFTP / Git :** publier le bon dossier de build, pas le dépôt complet ; vérifier la racine publique et ses fichiers accessibles.
- **DNS / domaine :** relever les enregistrements existants (MX, SPF, DKIM, TXT…) et l'impact email avant tout changement ; accord humain requis.
- **Base / jobs / paiement :** isoler sandbox/production, vérifier migrations, callbacks, quotas et restauration uniquement si ces fonctions existent.

## 5. Bilan et passation
- **Lieu :** README/fichier existant du dépôt ; `docs/DEPLOYMENT.md` seulement si une procédure dédiée est réellement utile. Jamais uniquement dans une conversation ou PR.
- **Décision :** [prêt / réserves / NO GO] ; preuves du §2 et éléments non vérifiés ; **mise en production seulement après GO humain explicite** et audit `PRE-DEPLOIEMENT.md`.
