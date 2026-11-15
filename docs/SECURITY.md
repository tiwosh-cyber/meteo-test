# SECURITY — [Nom du projet] · V3 (finale proposée)

> **Utilisation :** comptes, données privées, paiements ou services exposés. Site statique simple : `AGENTS.md` + `PRE-DEPLOIEMENT.md` suffisent.
> **Frontières :** sécurité globale ici ; routes/API → `BACKEND.md` ; RLS/stockage → `DATA.md` ; composants/XSS → `FRONTEND.md` ; stratégie de tests → `TESTING.md` ; infrastructure → `DEPLOYMENT.md` ; légal/accessibilité → `PRE-DEPLOIEMENT.md`.
> **Méthode :** partir du code et des décisions validées ; ne rien inventer. États : **prévu / implémenté / testé**. Décision essentielle manquante : signaler et bloquer l'action risquée.

## 1. Périmètre
- **Actifs et parcours exposés :** [données, comptes, paiements, IA…]
- **Frontières de confiance :** [navigateur, serveur, base, services tiers, rôles]
- **Fournisseurs / environnements :** [Auth, Git, hébergeur, DNS, paiement ; dev/prod]
- **Hors périmètre :** [ne pas implémenter]

## 2. Risques prioritaires
| Scénario crédible | Gravité | Protection et emplacement | État / preuve |
|---|---|---|---|
| [ex. prise de contrôle du compte d'administration] | [critique/élevé/…] | [contrôle concret, fichier ou réglage] | [prévu/implémenté/testé] |

**Blocage :** risque critique/élevé non maîtrisé = **NO GO** ; dérogation seulement par décision humaine explicite et documentée, sans prétendre le risque résolu.
**Gravité :** critique/élevé = accès non autorisé à des données ou droits sensibles, prise de compte, fuite de secret, perte de données ou abus coûteux ; qualifier selon impact et exploitabilité.

## 3. Dix règles transversales
1. **Autorisations :** refus par défaut ; identité et droit sur chaque ressource vérifiés côté serveur ou base → `BACKEND.md` / `DATA.md`.
2. **Auth (si utilisée) :** URL de retour explicitement autorisées (pas de joker large), confirmation email selon le besoin, mots de passe robustes/compromis si disponible ; limiter connexion/OTP/récupération, éviter l'énumération des comptes, MFA admin si possible. Vérifier expiration/révocation/déconnexion ; cookies : `Secure`, `HttpOnly`, `SameSite` et protection CSRF.
3. **Comptes plateformes :** MFA sur Git, hébergeur, BaaS, DNS, email et paiement ; accès limités et révoqués au départ. Toute vérification impossible = action humaine non vérifiée.
4. **Secrets :** jamais dans Git, frontend, logs ou Markdown. Préfixes publics selon le framework (`NEXT_PUBLIC_`, `VITE_`, `EXPO_PUBLIC_`, `PUBLIC_`) = accessibles au client : aucune clé privée. Examiner build et historique sans divulguer ; fuite = révoquer/rotater. Utiliser coffre et secrets distincts dev/prod.
5. **Navigateur :** HTTPS, HSTS après validation, `nosniff`, `Referrer-Policy`, anti-iframe (`frame-ancestors`) et CSP adaptée (tester en `Report-Only` si besoin). Aucun debug, erreur détaillée ou panneau admin public en prod. CORS ≠ autorisation.
6. **Contenu non fiable :** échapper les sorties ; HTML utilisateur assaini uniquement. Composants → `FRONTEND.md` ; injection et SSRF serveur → `BACKEND.md`.
7. **Dépendances :** paquets utiles et vérifiés, lockfile ; `npm audit --omit=dev` ou équivalent, traiter failles hautes/critiques exploitables. Alertes dépendances et détection de secrets au push si disponibles.
8. **Abus et IA :** limiter abus et coûts des appels email/SMS/paiement/IA. Si IA : entrées et réponses non fiables, outils limités aux droits utilisateur ; données transmises → `PRE-DEPLOIEMENT.md`.
9. **Données/logs :** journaliser les événements de sécurité sans secrets, jetons ni données sensibles complètes ; accès et rétention limités. Durées décidées dans `docs/` / `PRE-DEPLOIEMENT.md`, appliquées dans `DATA.md`.
10. **Outils/incidents :** MCP/CLI en dev ou lecture seule par défaut ; écriture en prod après accord. Définir alertes, révocation, preuves et restauration pour les services concernés. Ne jamais inventer une vérification.

## 4. Déclencheurs utiles
- **Site sans Auth :** ne pas inventer de rôles ; vérifier domaine, formulaires et secrets exposés.
- **Services tiers / email du domaine :** vérifier accès et, si applicable, SPF/DKIM/DMARC.
- **Risque élevé :** noter preuve et responsable dans §2 ; réutiliser les tests de `BACKEND.md` / `DATA.md`.

## 5. Contrôle pré-livraison
| Vérification | Preuve réelle / action humaine | État |
|---|---|---|
| Auth, comptes d'exploitation, accès privilégiés | [config vérifiée ou action à effectuer] | [N/A / non testé / réussi / échec] |
| Secrets (Git + build), dépendances, HTTPS et en-têtes | [outil, configuration, constat] | [N/A / non testé / réussi / échec] |
| IA, coûts, incidents, outils de production (si présents) | [test ou procédure vérifiée] | [N/A / non testé / réussi / échec] |
| Risques critiques/élevés et autorisations | [preuve BACKEND/DATA ou blocage] | [ouvert / maîtrisé] |

**Verdict :** [GO / RÉSERVES / NO GO + raison]. Preuves réelles uniquement ; `PRE-DEPLOIEMENT.md` les réutilise. Déploiement après accord explicite.
