# Configuration Sentry pour POS Superette

Guide complet pour configurer le monitoring d'erreurs avec Sentry.

## 📋 Prérequis

- Compte Sentry (gratuit) : https://sentry.io/signup/

## 🚀 Étapes de configuration

### 1. Créer un projet Sentry

1. Connectez-vous sur https://sentry.io/
2. Cliquez sur **"Create Project"**
3. Sélectionnez **Next.js** comme plateforme
4. Nommez votre projet : `pos-superette` (ou autre nom)
5. Cliquez sur **"Create Project"**

### 2. Récupérer les informations du projet

Après création, vous verrez une page avec des informations importantes :

**DSN (Data Source Name)** :
```
https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```
→ Copiez ce DSN complet

**Organization Slug** :
- Visible dans l'URL : `https://sentry.io/organizations/YOUR-ORG/`
- Exemple : `my-company`

**Project Slug** :
- Visible dans l'URL : `https://sentry.io/organizations/YOUR-ORG/projects/YOUR-PROJECT/`
- Exemple : `pos-superette`

### 3. Configurer les variables d'environnement dans Vercel

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet **pos-superette**
3. **Settings** → **Environment Variables**
4. Ajoutez les variables suivantes :

| Variable | Valeur | Environnements |
|----------|--------|----------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Votre DSN Sentry | Production, Preview, Development |
| `SENTRY_DSN` | Votre DSN Sentry (même valeur) | Production, Preview, Development |
| `SENTRY_ORG` | Votre organization slug | Production, Preview |
| `SENTRY_PROJECT` | Votre project slug | Production, Preview |

**Optionnel** (pour upload automatique des source maps) :
| Variable | Valeur | Environnements |
|----------|--------|----------------|
| `SENTRY_AUTH_TOKEN` | Token d'authentification | Production, Preview |

Pour créer un Auth Token :
1. Sentry → **Settings** → **Auth Tokens**
2. **Create New Token**
3. Permissions : `project:read` et `project:releases`
4. Copiez le token

### 4. Redéployer l'application

Une fois les variables ajoutées, Vercel redéployera automatiquement.

## ✅ Vérifier que Sentry fonctionne

### Méthode 1 : Déclencher une erreur test

1. Dans votre navigateur, ouvrez la console (F12)
2. Tapez :
```javascript
throw new Error("Test Sentry - Ceci est un test");
```
3. Allez sur Sentry → **Issues**
4. Vous devriez voir l'erreur apparaître en quelques secondes

### Méthode 2 : Erreur depuis l'application

1. Créez une route de test `/pages/api/sentry-test.js` :
```javascript
export default function handler(req, res) {
  throw new Error("Test Sentry API");
  res.status(200).json({ success: true });
}
```
2. Visitez : `https://votre-app.vercel.app/api/sentry-test`
3. Vérifiez Sentry → **Issues**

## 📊 Fonctionnalités activées

### 🔍 Error Tracking
- Toutes les erreurs JavaScript (client)
- Toutes les erreurs API/serveur
- Stack traces complètes
- Contexte utilisateur et navigateur

### 🎬 Session Replay
- Replay des sessions où une erreur s'est produite (100%)
- Replay aléatoire de 10% des sessions normales
- Masquage automatique du texte et médias sensibles

### 📈 Performance Monitoring
- Suivi des performances des pages
- Temps de chargement
- Transactions API

### 🚫 Filtrage intelligent
Erreurs ignorées automatiquement :
- Erreurs de réseau temporaires
- Erreurs de connexion non-critiques
- Erreurs en développement local (localhost)

## 🔧 Configuration avancée

### Personnaliser le filtrage

Éditez `sentry.client.config.js` ou `sentry.server.config.js` :

```javascript
ignoreErrors: [
  // Ajoutez vos patterns d'erreurs à ignorer
  'MonErreurCustom',
  /regex-pattern/,
],
```

### Ajuster le sampling

```javascript
// Réduire le nombre de sessions replay en production
replaysSessionSampleRate: 0.01, // 1% au lieu de 10%

// Réduire le tracking de performance
tracesSampleRate: 0.1, // 10% au lieu de 100%
```

### Ajouter du contexte aux erreurs

Dans votre code :
```javascript
import * as Sentry from "@sentry/nextjs";

// Ajouter un utilisateur
Sentry.setUser({
  id: userId,
  email: userEmail,
  username: username
});

// Ajouter du contexte
Sentry.setContext("commande", {
  orderId: "12345",
  total: 1500,
  items: 3
});

// Capturer manuellement une erreur
try {
  riskyOperation();
} catch (error) {
  Sentry.captureException(error);
}
```

## 💰 Plan gratuit Sentry

Le plan gratuit inclut :
- ✅ 5,000 erreurs par mois
- ✅ 50 Session Replays par mois
- ✅ 1 utilisateur
- ✅ Rétention de 30 jours
- ✅ Support email

Si vous dépassez ces limites, Sentry arrêtera simplement de tracker les erreurs jusqu'au mois suivant.

## 🆘 Dépannage

### "Sentry DSN not found"
→ Vérifiez que `NEXT_PUBLIC_SENTRY_DSN` est bien défini dans Vercel

### "No issues appearing"
→ Vérifiez que vous n'êtes pas en `localhost` (Sentry est désactivé localement)
→ Vérifiez les filtres dans Sentry → **Issues** (peut-être masqués)

### "Source maps not uploaded"
→ C'est normal si vous n'avez pas configuré `SENTRY_AUTH_TOKEN`
→ Les erreurs seront quand même trackées, mais avec du code minifié

## 📚 Ressources

- Documentation Sentry Next.js : https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Dashboard Sentry : https://sentry.io/organizations/YOUR-ORG/issues/
- Support : https://sentry.io/support/

---

**✅ Une fois configuré, Sentry vous alertera automatiquement de toute erreur en production !**
