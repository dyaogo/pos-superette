# 🔧 RÉSOLUTION DE PROBLÈMES - Module Comptabilité

## 🚨 Erreur : "categories.map is not a function"

### Cause
Cette erreur se produit lorsque :
1. La base de données n'a pas été mise à jour avec les nouvelles tables
2. Les catégories de dépenses n'ont pas été créées (seed non exécuté)
3. L'API retourne une erreur au lieu des données attendues

### Solution Rapide ✅

Exécutez ces commandes **dans l'ordre** :

```bash
# 1. Générer le client Prisma
npx prisma generate

# 2. Mettre à jour le schéma de la base de données
npx prisma db push

# 3. Créer les catégories de dépenses
node prisma/seed-expense-categories.js

# 4. Redémarrer le serveur
# Arrêtez le serveur (Ctrl+C) puis:
npm run dev
```

### Diagnostic Automatique 🔍

Nous avons créé un script de diagnostic pour vérifier automatiquement votre configuration :

```bash
node scripts/diagnose-accounting.js
```

**Ce script vérifie :**
- ✅ Connexion à la base de données
- ✅ Existence des tables ExpenseCategory et Expense
- ✅ Présence des catégories de dépenses
- ✅ Présence des magasins
- ✅ Relations entre les tables

**Résultat attendu :**
```
🔍 DIAGNOSTIC DU MODULE DE COMPTABILITÉ

1️⃣  Test de connexion à la base de données...
   ✅ Connexion réussie

2️⃣  Vérification de la table ExpenseCategory...
   ✅ Table ExpenseCategory existe (6 catégories)

   📋 Catégories disponibles:
      - Salaires (SAL)
      - Loyer (RNT)
      - Fournitures (FRN)
      - Gardiennage (GRD)
      - Facture Électricité (ELEC)
      - Facture Internet (NET)

3️⃣  Vérification de la table Expense...
   ✅ Table Expense existe (0 dépenses)

4️⃣  Vérification de la relation Store -> Expense...
   ✅ 1 magasin(s) trouvé(s):
      - Magasin Principal (xxx)

✅ La base de données est correctement configurée !
```

---

## 🚨 Erreur : "Prisma Client not found"

### Cause
Le client Prisma n'a pas été généré après les modifications du schéma.

### Solution
```bash
npx prisma generate
```

Si l'erreur persiste avec "403 Forbidden" :
```bash
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate
```

---

## 🚨 Erreur : "Table does not exist"

### Cause
Les nouvelles tables n'ont pas été créées dans la base de données.

### Solution
```bash
npx prisma db push
```

**Note :** Cette commande crée les tables sans migration. C'est parfait pour le développement.

---

## 🚨 Erreur : "Aucune catégorie disponible"

### Symptôme
Le menu déroulant "Catégorie" est vide dans le formulaire de création de dépense.

### Cause
Les catégories n'ont pas été créées (seed non exécuté).

### Solution
```bash
node prisma/seed-expense-categories.js
```

**Résultat attendu :**
```
✓ Created category: Salaires
✓ Created category: Loyer
✓ Created category: Fournitures
✓ Created category: Gardiennage
✓ Created category: Facture Électricité
✓ Created category: Facture Internet
✅ Expense categories seeded successfully!
```

---

## 🚨 Erreur : "Permission denied" ou "Unauthorized"

### Cause
Vous n'êtes pas connecté avec un compte ayant les permissions nécessaires.

### Solution

**Option 1 : Créer un admin automatiquement**
```bash
node scripts/create-test-admin.js
```

Puis connectez-vous avec :
- **Username** : `admin`
- **Password** : `admin123`

**Option 2 : Vérifier les permissions d'un utilisateur existant**

Ouvrez Prisma Studio :
```bash
npx prisma studio
```

1. Aller sur http://localhost:5555
2. Ouvrir la table `User`
3. Trouver votre utilisateur
4. Vérifier que le champ `role` est `admin` ou `manager`
5. Vérifier que `isActive` est `true`

---

## 🚨 Erreur : Le compte de résultat est vide

### Cause
Vous n'avez pas encore de ventes dans le système.

### Solution

Le compte de résultat calcule :
- **Revenus** : depuis les ventes
- **COGS** : depuis les coûts produits
- **Dépenses** : depuis les dépenses approuvées

**Pour avoir des données :**
1. Créez des ventes via la page **Caisse** (`/pos`)
2. Assurez-vous que vos produits ont un `costPrice` renseigné
3. Créez et approuvez des dépenses

---

## 🚨 Erreur : "Failed to fetch" dans le navigateur

### Cause
Le serveur n'est pas démarré ou l'API ne répond pas.

### Solution

1. **Vérifier que le serveur est démarré :**
   ```bash
   npm run dev
   ```

2. **Vérifier que le port 3000 est disponible :**
   ```bash
   # Sur Mac/Linux
   lsof -i :3000

   # Sur Windows
   netstat -ano | findstr :3000
   ```

3. **Tester l'API manuellement :**

   Ouvrez dans votre navigateur :
   - http://localhost:3000/api/expense-categories
   - http://localhost:3000/api/expenses

   Vous devriez voir du JSON, pas une erreur.

---

## 🚨 Erreur : "DATABASE_URL not found"

### Cause
Le fichier `.env` n'existe pas ou n'est pas configuré.

### Solution

1. **Copier le fichier exemple :**
   ```bash
   cp .env.example .env
   ```

2. **Éditer `.env` et renseigner `DATABASE_URL` :**
   ```
   DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
   DIRECT_URL="postgresql://user:password@host:5432/database?sslmode=require"
   ```

3. **Tester la connexion :**
   ```bash
   npx prisma db pull
   ```

---

## 🚨 Les dépenses n'apparaissent pas dans le compte de résultat

### Cause
Seules les dépenses avec statut **"approved"** ou **"paid"** sont incluses dans le compte de résultat.

### Solution

1. Aller dans l'onglet "Dépenses"
2. Trouver vos dépenses avec statut "En attente" (badge jaune)
3. Cliquer sur ✅ pour les approuver
4. Retourner au compte de résultat → Les dépenses apparaissent maintenant

---

## 🔍 Logs et Débogage

### Logs du serveur (terminal)
```bash
# Afficher les logs détaillés
npm run dev
```

Regardez les erreurs qui s'affichent dans le terminal.

### Logs du navigateur (console)
1. Ouvrir le navigateur
2. Appuyer sur **F12** (ou Cmd+Option+I sur Mac)
3. Aller dans l'onglet **Console**
4. Chercher les erreurs en rouge

### Vérifier la base de données avec Prisma Studio
```bash
npx prisma studio
```

Ouvrez http://localhost:5555 pour voir :
- Les catégories de dépenses (ExpenseCategory)
- Les dépenses (Expense)
- Les magasins (Store)
- Les utilisateurs (User)

---

## 📊 Checklist de Vérification Complète

Avant de tester le module, assurez-vous que :

- [ ] ✅ Le code est à jour (`git pull`)
- [ ] ✅ Les dépendances sont installées (`npm install`)
- [ ] ✅ Le client Prisma est généré (`npx prisma generate`)
- [ ] ✅ Le schéma DB est à jour (`npx prisma db push`)
- [ ] ✅ Les catégories sont créées (`node prisma/seed-expense-categories.js`)
- [ ] ✅ Un utilisateur admin existe (`node scripts/create-test-admin.js`)
- [ ] ✅ Au moins un magasin existe
- [ ] ✅ Le serveur est démarré (`npm run dev`)
- [ ] ✅ Vous êtes connecté avec un compte admin/manager
- [ ] ✅ Le menu "Comptabilité" est visible

---

## 🆘 Besoin d'Aide Supplémentaire ?

### Exécuter le diagnostic complet
```bash
node scripts/diagnose-accounting.js
```

### Réinitialiser complètement
Si rien ne fonctionne, réinitialisez tout :

```bash
# 1. Supprimer node_modules et réinstaller
rm -rf node_modules package-lock.json
npm install

# 2. Régénérer Prisma
npx prisma generate

# 3. Réappliquer le schéma
npx prisma db push --force-reset

# 4. Re-seed
node prisma/seed.js
node prisma/seed-expense-categories.js

# 5. Redémarrer
npm run dev
```

**⚠️ ATTENTION** : `--force-reset` supprime toutes les données ! À utiliser uniquement en développement.

---

## 📚 Documentation Associée

- **DEMARRAGE_RAPIDE.md** : Guide de démarrage en 5 minutes
- **GUIDE_TEST_COMPTABILITE.md** : Guide de test complet
- **ACCOUNTING_MODULE.md** : Documentation technique

---

## 🐛 Signaler un Bug

Si le problème persiste :

1. Exécutez `node scripts/diagnose-accounting.js`
2. Copiez le résultat complet
3. Notez les logs d'erreur du navigateur (F12 → Console)
4. Notez les logs d'erreur du serveur (terminal)
5. Signalez le problème avec tous ces détails

---

**Version** : 1.0.1
**Dernière mise à jour** : 3 Novembre 2025
