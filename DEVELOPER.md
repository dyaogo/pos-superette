# Guide Développeur - POS Superette

## 🚀 Installation locale

### Prérequis
- Node.js 18+ 
- PostgreSQL (via Neon ou local)
- Git

### Setup
```bash
git clone https://github.com/dyaogo/pos-superette.git
cd pos-superette
npm install
Configuration
Créez .env.local :
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
Lancer
bashnpx prisma generate
npx prisma db push
npm run dev
📁 Structure du projet
pos-superette/
├── pages/              # Pages Next.js
│   ├── api/           # API Routes
│   ├── dashboard.js   # Tableau de bord
│   ├── pos.js         # Point de vente
│   ├── inventory.js   # Inventaire
│   └── ...
├── components/        # Composants réutilisables
│   ├── Layout.js
│   ├── OfflineIndicator.js
│   └── ...
├── src/
│   ├── contexts/     # Context API (AppContext, AuthContext)
│   └── index.css     # Styles globaux
├── hooks/            # Custom hooks
├── utils/            # Fonctions utilitaires
├── prisma/           # Schéma base de données
└── scripts/          # Scripts utilitaires
🔧 Commandes disponibles
bashnpm run dev          # Développement
npm run build        # Build production
npm start            # Serveur production
npx prisma studio    # Interface DB
npx prisma db push   # Sync schéma
🎨 Conventions de code
Styles

Utiliser les variables CSS (var(--color-primary))
Classes utilitaires : animate-fade-in, hover-lift
Mode sombre supporté via body.dark-mode

Composants

Composants fonctionnels avec hooks
Props destructurées
Styles inline pour les composants simples

État

Context API pour l'état global (AppContext)
useState pour l'état local
useMemo pour les calculs coûteux

🔌 APIs
Routes disponibles

GET/POST /api/products - Produits
GET/PUT/DELETE /api/products/[id]
GET/POST /api/sales - Ventes
GET/POST /api/customers - Clients
GET/POST /api/credits - Crédits
GET/POST /api/returns - Retours

Exemple d'appel
javascriptconst response = await fetch('/api/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Produit', price: 1000 })
});
🚨 Gestion des erreurs
ErrorBoundary
Capture les erreurs React automatiquement.
Validation
Utiliser utils/validation.js avant les appels API :
javascriptimport { validateProduct } from '../utils/validation';

const { isValid, errors } = validateProduct(product);
if (!isValid) {
  alert(errors.join('\n'));
  return;
}
📱 Mode Offline
Le système gère automatiquement :

Détection online/offline
Queue de synchronisation
Cache localStorage
Indicateur visuel

Voir src/contexts/AppContext.jsx
🎯 Ajout d'une nouvelle page

Créer pages/nouvelle-page.js
Ajouter au menu dans components/Layout.js
Créer l'API route si nécessaire dans pages/api/
Ajouter au schéma Prisma si nouvelles données

🐛 Debugging
Logs

Console navigateur pour le frontend
Terminal pour le backend/API
npx prisma studio pour la DB

Erreurs communes

Module not found → npm install
Prisma error → npx prisma generate
DB sync error → Vérifier DATABASE_URL

🚀 Déploiement
Vercel (automatique)
Push sur GitHub → Auto-déployé
Variables requises sur Vercel

DATABASE_URL
DIRECT_URL

📚 Ressources

Next.js Docs
Prisma Docs
Lucide Icons

