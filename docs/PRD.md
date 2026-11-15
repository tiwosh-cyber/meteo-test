# METEO TEST — Décisions produit

État au 15/11/2026. Sources validées : [01 — Discovery](https://app.notion.com/p/419282ff070c80d8a859e55d0b41d732), [02 — Cadrage](https://app.notion.com/p/419282ff070c806f91f4ef6553236dbb), [05 — Cohérence](https://app.notion.com/p/419282ff070c80299842d5f47c15c31f). Ces décisions sont reproduites ici pour la reprise sans Notion.

## Objectif et profils

Projet personnel pédagogique pour éprouver les neuf phases Product Builder V2 : livrer une petite application réelle avec météo fictive, authentification, permissions, données persistantes puis déploiement sur accord. Cible d’infrastructure : 0 €/mois sous réserve des offres/quotas ; crédits d’outils IA exclus. L’objectif indicatif initial de 1–3 jours n’est pas une garantie.

- **Visiteur** : inscription libre, consultation après authentification, aucune administration ni écriture météo.
- **Manager** : compte créé séparément, consultation et modification météo. Aucun choix de rôle à l’inscription, aucune auto-promotion.
- **Non connecté** : inscription/connexion accessibles, ressources privées refusées dans l’application cible.

L’inscription ouvre une session sans confirmation email. Le risque d’inscription avec l’adresse d’un tiers est accepté pour ce test ; réexaminer ce choix si la destination du produit change.

## MVP et User Stories — toutes P0

| Fonction | User Story et intention | Règle validée | Critères |
| --- | --- | --- | --- |
| F-001 Inscription | US-001 : nouveau Visiteur, créer mon compte pour accéder immédiatement à l’application | Email/mot de passe, rôle Visiteur uniquement, pas de confirmation email ; saisie invalide/email déjà utilisé refusés | AC-001, AC-002 |
| F-002 Connexion/déconnexion | US-002 : utilisateur, contrôler ma session | Connexion des deux profils, refus d’identifiants invalides, accès authentifié retiré à la déconnexion | AC-003, AC-004, AC-005 |
| F-003 Autorisations | US-003 : utilisateur, limiter les accès selon mon rôle | Vérifications effectives côté données ; ne pas se limiter à masquer l’interface | AC-006, AC-007, AC-008 |
| F-004 Consultation | US-004 : utilisateur connecté, sélectionner une ville pour lire sa météo | Trois villes prédéfinies ; température, conditions, humidité ; état sans données explicite | AC-009, AC-010 |
| F-005 Panneau Manager | US-005 : Manager, accéder à la gestion météo | Manager seulement, URL directe interdite aux autres | AC-011, AC-012 |
| F-006 Modification météo | US-006 : Manager, mettre à jour les données consultées | Validation, enregistrement et persistance après actualisation ; aucune écriture Visiteur | AC-013, AC-014, AC-015 |

## Critères d’acceptation stables

Les résultats attendus ci-dessous sont ceux du MVP complet, pas des déclarations de réussite de l’aperçu.

| ID | Attendu vérifiable |
| --- | --- |
| AC-001 | Email inédit et mot de passe valide : compte Visiteur créé, session disponible sans clic de confirmation email. |
| AC-002 | Email déjà utilisé ou saisie invalide : inscription refusée, erreur compréhensible, aucun rôle Manager créé. |
| AC-003 | Identifiants valides : session du compte correspondant ouverte. |
| AC-004 | Identifiants incorrects : connexion refusée, aucune session authentifiée créée. |
| AC-005 | Après déconnexion, écrans protégés inaccessibles sans reconnexion. |
| AC-006 | Manager authentifié : opérations et écrans réservés autorisés. |
| AC-007 | Visiteur authentifié : administration/écriture directe refusée côté données, même en contournant l’interface. |
| AC-008 | Non authentifié : accès aux ressources privées refusé. |
| AC-009 | Chacune des trois villes sélectionnées affiche température, conditions et humidité correspondantes. |
| AC-010 | Données absentes : état vide explicite, sans crash ni fausse valeur. |
| AC-011 | Manager connecté : panneau d’administration accessible. |
| AC-012 | Visiteur : accès direct à l’URL d’administration interdit. |
| AC-013 | Manager soumet des valeurs autorisées : enregistrement réussi. |
| AC-014 | Après sauvegarde et actualisation, les nouvelles valeurs sont toujours affichées pour la ville concernée. |
| AC-015 | Requête d’écriture directe par un Visiteur : refus et données inchangées. |

## Données et règles

Les trois villes sont fixes, sans ajout/suppression. Données initiales de l’aperçu validé :

| Ville | Température | Conditions | Humidité |
| --- | --- | --- | --- |
| Paris | 22 °C | Ensoleillé | 45 % |
| Lyon | 18 °C | Nuageux | 60 % |
| Marseille | 26 °C | Ensoleillé | 35 % |

Température numérique finie ; aucune plage minimale/maximale produit supplémentaire décidée. Humidité numérique de 0 à 100 %, bornes incluses. Conditions contrôlées : Ensoleillé, Nuageux, Pluvieux, Orageux. Les validations client ne remplacent pas les contraintes côté données.

## Livraison actuelle et exclusions

Quatre écrans React acceptés en phase 04 ; [parcours et limites réels](FRONTEND.md). L’aperçu actuel est public et ne contient que des fixtures. Sa validation visuelle ne satisfait pas les critères d’authentification, RLS et persistance. Le GO avec réserves de phase 05 autorise la poursuite du workflow, pas une publication.

Hors MVP : météo réelle/API externe, géolocalisation, prévisions multijours, notifications, historique complexe, statistiques avancées, gestion des utilisateurs dans le panneau, ajout/suppression de villes, commentaires applicatifs, paiements et abonnements. Le champ « Commentaires » du cadrage n’est pas une fonctionnalité.

Succès final attendu : 6 fonctions P0 opérationnelles, 15 critères satisfaits avec preuves, refus de toutes les tentatives non autorisées prévues, changements persistants et application publiée après GO. Ces objectifs ne sont pas encore atteints.
