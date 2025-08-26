# POS Superette

Application web de point de vente pour superettes multi-magasins. Elle permet de gérer les ventes, l’inventaire et les clients depuis le navigateur. L’application est construite avec React, s’appuie sur Firebase pour l’authentification et les données, utilise **lucide-react** pour les icônes et enregistre un **service worker** pour la mise en cache hors‑ligne.

## Project Structure
The project is organized into feature-oriented modules within the `src/` directory:

- **assets/** – static images and other asset files.
- **components/** – reusable UI components and layout elements.
- **config/** – configuration files such as `firebase.js`.
- **contexts/** – React context providers for global state.
- **hooks/** – custom React hooks like `useAuth` and `useInventory`.
- **modules/** – domain modules (cash, credits, customers, dashboard, inventory, sales, etc.).
- **services/** – API clients and services.
- **utils/** – helper functions, constants, and formatters.

Static files like `index.html` reside in the `public/` directory.

## Available Scripts
## Modules

- Tableau de bord
- Caisse
- Ventes
- Inventaire
- Clients
- Crédits
- Retours
- Rapports
- Employés
- Paramètres

## Installation

1. Cloner le dépôt puis installer les dépendances :

   ```bash
   npm install
   ```

2. Copier `.env.example` vers `.env` et renseigner les variables, notamment les identifiants Firebase.

3. Démarrer le serveur de développement :

   ```bash
   npm start
   ```

## Build & tests

- Lancer les tests :

  ```bash
  npm test
  ```

- Construire la version de production :

  ```bash
  npm run build
  ```

## Configuration

Le fichier `.env.example` répertorie toutes les variables d’environnement utilisées par l’application. Remplacez les valeurs par celles de votre projet avant de lancer l’application.

## Déploiement sur Vercel

1. Importez ce dépôt dans [Vercel](https://vercel.com/) via **New Project** et sélectionnez la source GitHub correspondante.
2. Dans l’onglet **Settings > Environment Variables**, créez les variables listées dans `.env.example` (`REACT_APP_FIREBASE_API_KEY`, `REACT_APP_FIREBASE_AUTH_DOMAIN`, etc.) pour les environnements **Production** et **Preview**.
3. Conservez la commande de build par défaut `npm run build` et le dossier de sortie `build` (valeurs par défaut de Create React App).
4. Déployez le projet. Vercel utilisera ces variables lors du build et à l’exécution.

## Dépendances clés

- [Firebase](https://firebase.google.com/) : authentification et base de données.
- [lucide-react](https://lucide.dev/) : bibliothèque d’icônes.
- Service worker (`src/serviceWorkerRegistration.js`) : support hors‑ligne et cache.

