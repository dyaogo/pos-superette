# 🧪 GUIDE DE TEST - MODULE COMPTABILITÉ

## ⚠️ Note Importante

Ce guide est à exécuter sur **votre machine locale** (pas dans l'environnement Claude Code).
Les commandes Prisma nécessitent un accès réseau complet.

---

## 📋 PRÉ-REQUIS

Avant de commencer, assurez-vous d'avoir :
- ✅ Node.js installé (v16 ou supérieur)
- ✅ Git installé
- ✅ Accès à votre base de données PostgreSQL (Neon)

---

## 🚀 ÉTAPE 1 : Récupérer le Code

```bash
# Cloner ou mettre à jour votre dépôt
git pull origin claude/analyze-repository-011CUmXFT4Akz9qFoKJV2s1w

# Ou si vous travaillez sur votre machine :
git checkout claude/analyze-repository-011CUmXFT4Akz9qFoKJV2s1w
```

---

## 📦 ÉTAPE 2 : Installer les Dépendances

```bash
# Si ce n'est pas déjà fait
npm install
```

---

## 🗄️ ÉTAPE 3 : Mettre à Jour la Base de Données

```bash
# 1. Générer le client Prisma avec les nouveaux modèles
npx prisma generate

# 2. Pousser le nouveau schéma vers la base de données
npx prisma db push

# 3. Créer les catégories de dépenses par défaut
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

## 🖥️ ÉTAPE 4 : Démarrer le Serveur

```bash
npm run dev
```

**Résultat attendu :**
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

Laissez ce terminal ouvert et ouvrez votre navigateur.

---

## 🌐 ÉTAPE 5 : Se Connecter

1. **Ouvrir le navigateur** : http://localhost:3000

2. **Se connecter avec un compte Admin ou Manager**

   Si vous n'avez pas encore de compte, vous devez en créer un :

   **Option A : Créer un admin via Prisma Studio**
   ```bash
   # Dans un nouveau terminal
   npx prisma studio
   ```
   - Ouvrir http://localhost:5555
   - Aller dans la table `User`
   - Cliquer sur "Add record"
   - Remplir :
     - `username`: admin
     - `email`: admin@test.com
     - `password`: (utiliser un hash bcrypt - voir ci-dessous)
     - `fullName`: Administrateur
     - `role`: admin
     - `isActive`: true

   **Pour générer un hash bcrypt du mot de passe :**
   ```bash
   node -e "console.log(require('bcryptjs').hashSync('admin123', 10))"
   ```

   **Option B : Utiliser un compte existant**
   - Vérifiez dans Prisma Studio les utilisateurs existants
   - Utilisez les identifiants d'un utilisateur avec rôle `admin` ou `manager`

3. **Se connecter**
   - Aller sur http://localhost:3000/login
   - Entrer : `admin` / `admin123` (ou vos identifiants)
   - Cliquer sur "Connexion"

---

## 💰 ÉTAPE 6 : Accéder au Module Comptabilité

1. **Dans la barre latérale**, chercher le menu "**Comptabilité**" (icône calculatrice 🧮)

2. **Cliquer dessus** → Vous devez arriver sur `/accounting`

3. **Vous devriez voir :**
   - Un onglet "Dépenses" (actif par défaut)
   - Un onglet "Compte de Résultat"
   - Des statistiques à zéro
   - Un bouton "+ Nouvelle Dépense"

---

## 📝 ÉTAPE 7 : Tester la Création d'une Dépense

### Test 1 : Créer une première dépense

1. **Cliquer sur "+ Nouvelle Dépense"**

2. **Remplir le formulaire :**
   - **Catégorie** : Loyer
   - **Montant** : 150000
   - **Description** : Loyer du magasin - Novembre 2025
   - **Numéro de facture** : FAC-2025-001
   - **Fournisseur** : Propriétaire Dupont
   - **Mode de paiement** : Virement bancaire
   - **Date d'échéance** : 30/11/2025
   - **Notes** : Paiement mensuel

3. **Cliquer sur "Créer"**

4. **Résultat attendu :**
   - Message de succès : "Dépense créée"
   - La dépense apparaît dans la liste
   - Statut : "En attente" (badge jaune)
   - Statistiques mises à jour

### Test 2 : Créer d'autres dépenses

Créez quelques autres dépenses pour avoir des données :

**Dépense 2 :**
- Catégorie : Salaires
- Montant : 200000
- Description : Salaire caissier - Novembre
- Fournisseur : Jean Dupont

**Dépense 3 :**
- Catégorie : Facture Électricité
- Montant : 45000
- Description : Consommation électrique - Octobre

**Dépense 4 :**
- Catégorie : Facture Internet
- Montant : 25000
- Description : Abonnement internet - Novembre

---

## ✅ ÉTAPE 8 : Tester le Workflow d'Approbation

### Test du workflow complet

1. **Approuver une dépense**
   - Dans la liste, trouver la dépense "Loyer"
   - Cliquer sur l'icône ✅ (check vert)
   - **Résultat** : Statut passe à "Approuvée" (badge bleu)

2. **Marquer comme payée**
   - Sur la même dépense, cliquer sur l'icône 🧾 (reçu)
   - **Résultat** : Statut passe à "Payée" (badge vert)

3. **Approuver les autres dépenses**
   - Approuver toutes les autres dépenses (Salaires, Électricité, Internet)

4. **Vérifier les statistiques**
   - Le total "Dépenses (Approuvées)" doit afficher : 420 000 FCFA
   - Le total "En attente d'approbation" doit être à 0

---

## 📊 ÉTAPE 9 : Tester le Compte de Résultat

### Pré-requis : Avoir des ventes dans le système

Pour tester le compte de résultat, il faut avoir des ventes. Si vous n'en avez pas :

1. **Aller sur la page Caisse** (`/pos`)
2. **Créer quelques ventes de test**
3. **Revenir à la Comptabilité**

### Test du Compte de Résultat

1. **Cliquer sur l'onglet "Compte de Résultat"**

2. **Sélectionner une période**
   - Date de début : 01/11/2025
   - Date de fin : 30/11/2025

3. **Vérifier les KPIs affichés :**
   - ✅ **Revenus** : Total des ventes sur la période
   - ✅ **Marge Brute** : Revenus - COGS (avec pourcentage)
   - ✅ **Dépenses** : 420 000 FCFA (nos 4 dépenses)
   - ✅ **Résultat Net** : Marge brute - Dépenses (vert si positif, rouge si négatif)

4. **Vérifier le détail du compte de résultat**
   - Section REVENUS :
     - Chiffre d'affaires HT
     - TVA collectée
   - Section COÛT DES MARCHANDISES VENDUES
   - Section MARGE BRUTE (en vert)
   - Section DÉPENSES OPÉRATIONNELLES :
     - Loyer : 150 000 FCFA
     - Salaires : 200 000 FCFA
     - Facture Électricité : 45 000 FCFA
     - Facture Internet : 25 000 FCFA
   - Section RÉSULTAT NET (en vert ou rouge)

5. **Vérifier le tableau "Top Produits par Profit"**
   - Liste des produits les plus rentables
   - Colonnes : Produit, Quantité, Coût, Revenu, Profit

---

## 🎯 ÉTAPE 10 : Tests de Filtrage

### Test des filtres de dépenses

1. **Retourner à l'onglet "Dépenses"**

2. **Tester le filtre par statut**
   - Sélectionner "En attente" → Devrait afficher 0 dépense
   - Sélectionner "Approuvées" → Devrait afficher les dépenses approuvées
   - Sélectionner "Payées" → Devrait afficher les dépenses payées
   - Sélectionner "Tous les statuts" → Devrait afficher toutes

3. **Tester le filtre par catégorie**
   - Sélectionner "Loyer" → Affiche uniquement le loyer
   - Sélectionner "Salaires" → Affiche uniquement les salaires
   - Sélectionner "Toutes les catégories" → Affiche tout

---

## 🧪 ÉTAPE 11 : Tests de Suppression

1. **Créer une dépense de test**
   - Catégorie : Fournitures
   - Montant : 5000
   - Description : Test suppression

2. **Supprimer la dépense**
   - Cliquer sur l'icône 🗑️ (poubelle)
   - Confirmer la suppression
   - **Résultat** : La dépense disparaît de la liste

---

## ✅ CHECKLIST DE VALIDATION

Cochez chaque élément testé :

### Base de données
- [ ] `npx prisma generate` exécuté sans erreur
- [ ] `npx prisma db push` exécuté sans erreur
- [ ] Les 6 catégories créées avec succès

### Connexion
- [ ] Serveur démarré sur http://localhost:3000
- [ ] Connexion réussie avec admin/manager
- [ ] Menu "Comptabilité" visible dans la barre latérale

### Gestion des dépenses
- [ ] Création d'une dépense (Loyer - 150 000 FCFA)
- [ ] Création d'autres dépenses (Salaires, Électricité, Internet)
- [ ] Statut initial : "En attente" (badge jaune)
- [ ] Statistiques mises à jour
- [ ] Formulaire se ferme après création

### Workflow d'approbation
- [ ] Approbation d'une dépense (✅) → Statut "Approuvée" (bleu)
- [ ] Marquage comme payée (🧾) → Statut "Payée" (vert)
- [ ] Statistiques "Dépenses approuvées" correctes
- [ ] Statistiques "En attente" correctes

### Compte de Résultat
- [ ] Onglet "Compte de Résultat" accessible
- [ ] KPI "Revenus" affiché correctement
- [ ] KPI "Marge Brute" calculé (avec COGS réel)
- [ ] KPI "Dépenses" = 420 000 FCFA
- [ ] KPI "Résultat Net" calculé correctement
- [ ] Détail des revenus (CA HT, TVA)
- [ ] Détail des dépenses par catégorie
- [ ] Tableau "Top Produits par Profit" affiché

### Filtres
- [ ] Filtre par statut fonctionne
- [ ] Filtre par catégorie fonctionne
- [ ] Combinaison de filtres fonctionne

### Suppression
- [ ] Suppression d'une dépense fonctionne
- [ ] Confirmation demandée avant suppression
- [ ] Liste mise à jour après suppression

---

## 🐛 PROBLÈMES COURANTS

### "Permission denied" ou "Unauthorized"
**Solution :** Vérifiez que vous êtes connecté avec un compte `admin` ou `manager`

### "Aucune catégorie disponible" dans le formulaire
**Solution :** Exécutez `node prisma/seed-expense-categories.js`

### Le compte de résultat affiche "Aucune donnée"
**Solution :** Créez des ventes d'abord via la page Caisse (`/pos`)

### Les dépenses n'apparaissent pas dans le compte de résultat
**Solution :** Assurez-vous que les dépenses sont "Approuvées" ou "Payées", pas "En attente"

### Erreur Prisma lors du `db push`
**Solution :** Vérifiez que votre `DATABASE_URL` dans `.env` est correcte

---

## 📸 CAPTURES D'ÉCRAN ATTENDUES

### Page Dépenses
Vous devriez voir :
- Header avec titre "Gestion des Dépenses"
- 3 cartes statistiques (Total, En attente, Total dépenses)
- Filtres (Statut, Catégorie)
- Tableau avec colonnes : Date, Catégorie, Description, Montant, Statut, Actions
- Bouton "+ Nouvelle Dépense"

### Formulaire de Création
- Modal avec titre "Nouvelle dépense"
- Champs : Catégorie*, Montant*, Description*
- Champs optionnels : N° facture, Fournisseur, Mode paiement, Date échéance, Notes
- Boutons : Annuler, Créer

### Compte de Résultat
- 4 KPIs en haut : Revenus, Marge Brute, Dépenses, Résultat Net
- Sélecteur de dates
- Détail du compte avec sections colorées
- Tableau des produits rentables en bas

---

## 📞 BESOIN D'AIDE ?

Si vous rencontrez des problèmes :

1. **Vérifiez les logs de la console** du navigateur (F12)
2. **Vérifiez les logs du serveur** dans le terminal
3. **Vérifiez la base de données** avec Prisma Studio : `npx prisma studio`

---

## 🎉 SUCCÈS !

Si tous les tests passent, le module de comptabilité est **100% fonctionnel** !

Vous pouvez maintenant :
- Gérer vos dépenses réelles
- Suivre vos finances en temps réel
- Analyser votre rentabilité par produit
- Exporter les rapports (à venir)

---

**Version** : 1.0.0
**Date** : 3 Novembre 2025
**Support** : Consultez ACCOUNTING_MODULE.md pour plus de détails
