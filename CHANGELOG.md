# Changelog

Toutes les modifications importantes du projet sont documentées ici.

## [1.2.0] - 2025-01-06

### Ajouté
- Mode sombre complet avec toggle
- Mode offline robuste avec synchronisation automatique
- Impression de reçus avec partage SMS/WhatsApp
- Export Excel des rapports
- Notifications de stock faible
- Raccourcis clavier pour le POS (F1, F2, F3)
- Scanner de codes-barres
- Pagination sur les pages avec beaucoup de données
- ErrorBoundary pour gérer les erreurs
- LoadingSpinner réutilisable
- Validation des données (produits, clients, ventes)

### Amélioré
- Design system moderne avec variables CSS
- Performance avec useMemo et pagination
- Gestion des erreurs
- Documentation développeur

### Corrigé
- Problème de synchronisation offline
- Contraste en mode sombre

## [1.1.0] - 2025-10-05

### Ajouté
- Dashboard avec statistiques
- Point de vente (POS)
- Gestion d'inventaire
- Historique des ventes
- Gestion des clients
- Crédits clients
- Retours et remboursements
- Rapports avancés
- Paramètres

### Technique
- Migration vers Next.js 15
- Base de données PostgreSQL (Neon)
- Prisma ORM
- Déploiement Vercel