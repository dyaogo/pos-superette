# 🚀 DÉMARRAGE RAPIDE - Test du Module Comptabilité

## ⚡ Version Express (5 minutes)

Ce guide vous permet de tester rapidement le module de comptabilité.

---

## 📋 Pré-requis

- Node.js installé
- Git installé
- Avoir cloné le projet

---

## 🎯 LES 5 COMMANDES ESSENTIELLES

Exécutez ces commandes **dans l'ordre** sur votre machine locale :

### 1️⃣ Mettre à jour le code

```bash
git pull origin claude/analyze-repository-011CUmXFT4Akz9qFoKJV2s1w
```

### 2️⃣ Installer les dépendances (si besoin)

```bash
npm install
```

### 3️⃣ Configurer la base de données

```bash
# Générer le client Prisma
npx prisma generate

# Mettre à jour le schéma
npx prisma db push

# Créer les catégories de dépenses
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

### 4️⃣ Créer un compte admin de test

```bash
node scripts/create-test-admin.js
```

**Résultat attendu :**
```
✅ Utilisateur admin créé avec succès!

Informations de connexion:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Nom d'utilisateur: admin
  Mot de passe:      admin123
  Email:             admin@test.com
  Rôle:              Administrateur
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 5️⃣ Démarrer le serveur

```bash
npm run dev
```

**Résultat attendu :**
```
ready - started server on 0.0.0.0:3000
```

---

## 🌐 TESTER DANS LE NAVIGATEUR

### Étape 1 : Se connecter

1. Ouvrir : **http://localhost:3000**
2. Cliquer sur "Se connecter"
3. Entrer :
   - **Utilisateur** : `admin`
   - **Mot de passe** : `admin123`
4. Cliquer sur "Connexion"

### Étape 2 : Accéder à la Comptabilité

1. Dans la **barre latérale**, chercher l'icône calculatrice 🧮
2. Cliquer sur **"Comptabilité"**
3. Vous devriez voir deux onglets :
   - 📝 Dépenses
   - 📊 Compte de Résultat

### Étape 3 : Créer une dépense de test

1. Cliquer sur **"+ Nouvelle Dépense"**
2. Remplir :
   - **Catégorie** : Loyer
   - **Montant** : 150000
   - **Description** : Loyer novembre 2025
3. Cliquer sur **"Créer"**
4. **Résultat** : La dépense apparaît avec un badge jaune "En attente"

### Étape 4 : Approuver la dépense

1. Cliquer sur l'icône **✅** (check vert) dans la colonne Actions
2. **Résultat** : Le badge devient bleu "Approuvée"

### Étape 5 : Marquer comme payée

1. Cliquer sur l'icône **🧾** (reçu) dans la colonne Actions
2. **Résultat** : Le badge devient vert "Payée"

### Étape 6 : Voir le compte de résultat

1. Cliquer sur l'onglet **"Compte de Résultat"**
2. **Résultat** : Vous voyez :
   - Les revenus (si vous avez des ventes)
   - La marge brute
   - Les dépenses (150 000 FCFA)
   - Le résultat net

---

## ✅ TEST RÉUSSI !

Si vous avez pu :
- ✅ Créer une dépense
- ✅ L'approuver
- ✅ La marquer comme payée
- ✅ La voir dans le compte de résultat

**Le module fonctionne parfaitement ! 🎉**

---

## 🎯 TESTS AVANCÉS (Optionnel)

Pour tester toutes les fonctionnalités, consultez :
📄 **GUIDE_TEST_COMPTABILITE.md** (guide complet avec 11 étapes de test)

---

## 🐛 PROBLÈMES ?

### "npx prisma generate" échoue
```bash
# Essayer avec :
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate
```

### "Permission denied" dans l'app
- Assurez-vous d'être connecté avec le compte `admin`
- Vérifiez que le rôle est bien "admin" dans la base de données

### Le compte de résultat est vide
- Normal si vous n'avez pas encore de ventes
- Créez quelques ventes via la page Caisse (`/pos`)

### Les catégories n'apparaissent pas
```bash
# Re-exécuter :
node prisma/seed-expense-categories.js
```

---

## 📚 DOCUMENTATION COMPLÈTE

- **ACCOUNTING_MODULE.md** : Documentation technique du module
- **GUIDE_TEST_COMPTABILITE.md** : Guide de test détaillé (11 étapes)
- **README.md** : Documentation générale du projet

---

## 🎨 APERÇU DES FONCTIONNALITÉS

### Gestion des Dépenses
- ✅ Création avec 6 catégories prédéfinies
- ✅ Workflow d'approbation (Pending → Approved → Paid)
- ✅ Filtres par statut et catégorie
- ✅ Statistiques en temps réel

### Compte de Résultat
- ✅ Revenus (ventes)
- ✅ COGS réel (calculé depuis les prix de revient)
- ✅ Marge brute avec %
- ✅ Dépenses par catégorie
- ✅ Résultat net avec marge nette %
- ✅ Top 10 produits par profit

### Catégories par Défaut
1. 💚 Salaires
2. 🔵 Loyer
3. 🟣 Fournitures
4. 🟠 Gardiennage
5. 🟡 Facture Électricité
6. 🔷 Facture Internet

---

**Bon test ! 🚀**

Si tout fonctionne, n'hésitez pas à créer des dépenses réelles et à explorer le compte de résultat avec vos vraies données de ventes.
