// src/stores/posStore.js
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

/**
 * Store POS unifié avec Zustand
 * Compatible avec votre architecture existante
 */
export const usePOSStore = create()(
  devtools(
    persist(
      immer((set, get) => ({
        // ==================== ÉTAT INITIAL ====================
        
        // Session de caisse (compatible avec votre système existant)
        cashSession: null,
        cashOperations: [],
        
        // Panier de vente
        cart: [],
        
        // Historique des ventes (sera synchronisé avec AppContext)
        salesHistory: [],
        
        // États UI du POS
        selectedCustomer: null,
        paymentMethod: 'cash',
        showPaymentModal: false,
        
        // ==================== ACTIONS CAISSE ====================
        
        /**
         * Ouvrir une session de caisse
         * Compatible avec votre ModernCashRegister existant
         */
        openCashSession: (initialAmount, operator = 'Caissier') => set(state => {
          const newSession = {
            id: Date.now(),
            openedAt: new Date().toISOString(),
            openedBy: operator,
            initialAmount: parseFloat(initialAmount),
            status: 'open'
          };
          
          const openOperation = {
            id: Date.now(),
            type: 'opening',
            amount: parseFloat(initialAmount),
            timestamp: new Date().toISOString(),
            description: 'Ouverture de caisse',
            operator
          };
          
          // Synchroniser avec localStorage (compatibilité existante)
          localStorage.setItem('cash_session_v2', JSON.stringify(newSession));
          localStorage.setItem('cash_operations_v2', JSON.stringify([openOperation]));
          
          state.cashSession = newSession;
          state.cashOperations = [openOperation];
        }),
        
        /**
         * Fermer la session de caisse
         */
        closeCashSession: (actualCash, notes = '', operator = 'Caissier') => set(state => {
          if (!state.cashSession) return;
          
          const sessionSales = state.salesHistory.filter(sale => 
            new Date(sale.createdAt || sale.date) >= new Date(state.cashSession.openedAt) &&
            sale.cashSessionId === state.cashSession.id
          );
          
          const cashSalesTotal = sessionSales
            .filter(s => s.paymentMethod === 'cash')
            .reduce((sum, s) => sum + (s.total || 0), 0);
          
          const expectedCash = state.cashSession.initialAmount + cashSalesTotal;
          const difference = actualCash - expectedCash;
          
          const closingReport = {
            sessionId: state.cashSession.id,
            openedAt: state.cashSession.openedAt,
            closedAt: new Date().toISOString(),
            closedBy: operator,
            initialAmount: state.cashSession.initialAmount,
            expectedCash,
            actualCash,
            difference,
            salesCount: sessionSales.length,
            totalSales: sessionSales.reduce((sum, s) => sum + (s.total || 0), 0),
            notes,
            operations: [...state.cashOperations]
          };
          
          // Sauvegarder le rapport
          const reports = JSON.parse(localStorage.getItem('cash_reports') || '[]');
          reports.push(closingReport);
          localStorage.setItem('cash_reports', JSON.stringify(reports));
          
          // Nettoyer localStorage et state
          localStorage.removeItem('cash_session_v2');
          localStorage.removeItem('cash_operations_v2');
          
          state.cashSession = null;
          state.cashOperations = [];
        }),
        
        /**
         * Synchroniser depuis localStorage (pour compatibilité)
         */
        syncFromLocalStorage: () => set(state => {
          try {
            const session = localStorage.getItem('cash_session_v2');
            const operations = localStorage.getItem('cash_operations_v2');
            
            if (session) {
              state.cashSession = JSON.parse(session);
            }
            
            if (operations) {
              state.cashOperations = JSON.parse(operations);
            }
          } catch (error) {
            console.warn('Erreur sync localStorage:', error);
          }
        }),
        
        /**
         * Ajouter une opération de caisse
         */
        addCashOperation: (type, amount, description, operator = 'Caissier') => set(state => {
          if (!state.cashSession) return;
          
          const operation = {
            id: Date.now(),
            type, // 'in' | 'out' | 'adjustment'
            amount: parseFloat(amount),
            timestamp: new Date().toISOString(),
            description,
            operator
          };
          
          state.cashOperations.push(operation);
          
          // Synchroniser avec localStorage
          localStorage.setItem('cash_operations_v2', JSON.stringify(state.cashOperations));
        }),
        
        // ==================== ACTIONS PANIER ====================
        
        /**
         * Ajouter un produit au panier
         */
        addToCart: (product, quantity = 1) => set(state => {
          const existingIndex = state.cart.findIndex(item => item.id === product.id);
          
          if (existingIndex >= 0) {
            state.cart[existingIndex].quantity += quantity;
          } else {
            state.cart.push({
              ...product,
              quantity,
              addedAt: new Date().toISOString()
            });
          }
        }),
        
        /**
         * Mettre à jour la quantité d'un article
         */
        updateCartItemQuantity: (productId, newQuantity) => set(state => {
          if (newQuantity <= 0) {
            state.cart = state.cart.filter(item => item.id !== productId);
          } else {
            const itemIndex = state.cart.findIndex(item => item.id === productId);
            if (itemIndex >= 0) {
              state.cart[itemIndex].quantity = newQuantity;
            }
          }
        }),
        
        /**
         * Supprimer un article du panier
         */
        removeFromCart: (productId) => set(state => {
          state.cart = state.cart.filter(item => item.id !== productId);
        }),
        
        /**
         * Vider le panier
         */
        clearCart: () => set(state => {
          state.cart = [];
        }),
        
        // ==================== ACTIONS VENTES ====================
        
        /**
         * Traiter une vente - Compatible avec votre système existant
         */
        processSale: async (saleData) => {
          const state = get();
          
          if (!state.cashSession) {
            throw new Error('Aucune session de caisse active');
          }
          
          // Format unifié compatible avec votre structure existante
          const sale = {
            // IDs et références
            id: Date.now(),
            receiptNumber: `REC${Date.now().toString().slice(-6)}`,
            
            // Horodatage (compatible avec vos deux formats)
            date: new Date().toISOString(), // Pour compatibilité existante
            createdAt: new Date().toISOString(), // Format moderne
            timestamp: new Date().toISOString(), // Backup compatibilité
            
            // Données client
            customerId: saleData.customerId || state.selectedCustomer?.id || 1,
            customerName: saleData.customerName || state.selectedCustomer?.name || 'Client Comptant',
            customer: state.selectedCustomer, // Compatibilité format existant
            
            // Articles vendus (format compatible)
            items: saleData.items || state.cart.map(item => ({
              id: item.id,
              name: item.name,
              sku: item.sku || '',
              barcode: item.barcode || '',
              price: item.price,
              quantity: item.quantity,
              total: item.price * item.quantity, // Format existant
              subtotal: item.price * item.quantity, // Format moderne
              category: item.category
            })),
            
            // Montants (tous les formats pour compatibilité)
            subtotal: saleData.subtotal || state.getCartStats().subtotal,
            totalAmount: saleData.subtotal || state.getCartStats().subtotal, // Compat
            tax: saleData.taxAmount || state.getCartStats().taxAmount,
            totalTax: saleData.taxAmount || state.getCartStats().taxAmount, // Compat
            total: saleData.total || state.getCartStats().total,
            finalTotal: saleData.total || state.getCartStats().total, // Compat
            
            // Paiement
            paymentMethod: saleData.paymentMethod || state.paymentMethod,
            amountReceived: saleData.amountReceived || saleData.total || state.getCartStats().total,
            change: saleData.changeAmount || 0,
            changeAmount: saleData.changeAmount || 0, // Format moderne
            
            // Métadonnées
            cashSession: state.cashSession.id, // Format existant
            cashSessionId: state.cashSession.id, // Format moderne
            operatorId: saleData.operatorId || 'caissier_1',
            storeId: saleData.storeId || 'store_main',
            
            // États
            status: 'completed',
            refunded: false,
            refundedAt: null
          };
          
          // Mise à jour du store
          set(draft => {
            draft.salesHistory.unshift(sale);
            draft.cart = [];
            draft.showPaymentModal = false;
            });
          
          // ✅ NOUVEAU : Forcer la mise à jour de l'AppContext
        try {
          // Déclencher une re-synchronisation immédiate
          const currentAppHistory = JSON.parse(localStorage.getItem(`pos_${localStorage.getItem('pos_current_store') || 'WK001'}_sales`) || '[]');
          currentAppHistory.unshift(sale);
          localStorage.setItem(`pos_${localStorage.getItem('pos_current_store') || 'WK001'}_sales`, JSON.stringify(currentAppHistory));
          
          // Déclencher un événement pour forcer la re-synchronisation
          window.dispatchEvent(new CustomEvent('pos-sale-added', { detail: sale }));
        } catch (error) {
          console.warn('Erreur mise à jour localStorage:', error);
        }
        
        return sale;
        },
        
        /**
         * Rembourser une vente
         */
        refundSale: (saleId, reason = '') => set(state => {
          const saleIndex = state.salesHistory.findIndex(s => s.id === saleId);
          if (saleIndex >= 0) {
            state.salesHistory[saleIndex].status = 'refunded';
            state.salesHistory[saleIndex].refunded = true;
            state.salesHistory[saleIndex].refundedAt = new Date().toISOString();
            state.salesHistory[saleIndex].refundReason = reason;
          }
        }),
        
        /**
         * Synchroniser l'historique depuis AppContext
         */
        setSalesHistory: (salesHistory) => set(state => {
          state.salesHistory = salesHistory || [];
        }),
        
        // ==================== GETTERS / SÉLECTEURS ====================
        
        /**
         * Calculer les statistiques du panier
         */
        getCartStats: () => {
          const cart = get().cart;
          const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const taxRate = 0.18; // 18% - à configurer selon vos besoins
          const taxAmount = subtotal * taxRate;
          const total = subtotal + taxAmount;
          
          return {
            itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
            subtotal: Math.round(subtotal * 100) / 100,
            taxAmount: Math.round(taxAmount * 100) / 100,
            total: Math.round(total * 100) / 100,
            isEmpty: cart.length === 0
          };
        },
        
        /**
         * Obtenir les ventes de la session actuelle
         */
        getSessionSales: () => {
          const { cashSession, salesHistory } = get();
          if (!cashSession) return [];
          
          return salesHistory.filter(sale => {
            const saleDate = new Date(sale.createdAt || sale.date);
            const sessionDate = new Date(cashSession.openedAt);
            return saleDate >= sessionDate && 
                   (sale.cashSessionId === cashSession.id || sale.cashSession === cashSession.id);
          });
        },
        
        /**
         * Statistiques de la session
         */
        getSessionStats: () => {
          const sessionSales = get().getSessionSales();
          
          const validSales = sessionSales.filter(s => 
            s && s.paymentMethod && typeof s.paymentMethod === 'string' && s.total > 0
          );
          
          return {
            totalSales: validSales.reduce((sum, s) => sum + s.total, 0),
            totalTransactions: validSales.length,
            cashSales: validSales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.total, 0),
            cardSales: validSales.filter(s => s.paymentMethod === 'card').reduce((sum, s) => sum + s.total, 0),
            creditSales: validSales.filter(s => s.paymentMethod === 'credit').reduce((sum, s) => sum + s.total, 0),
            averageTicket: validSales.length > 0 ? validSales.reduce((sum, s) => sum + s.total, 0) / validSales.length : 0
          };
        },
        
        // ==================== ACTIONS UI ====================
        
        /**
         * Sélectionner un client
         */
        setSelectedCustomer: (customer) => set(state => {
          state.selectedCustomer = customer;
        }),
        
        /**
         * Changer le mode de paiement
         */
        setPaymentMethod: (method) => set(state => {
          state.paymentMethod = method;
        }),
        
        /**
         * Afficher/masquer la modal de paiement
         */
        setShowPaymentModal: (show) => set(state => {
          state.showPaymentModal = show;
        }),
        
        // ==================== UTILITAIRES ====================
        
        /**
         * Réinitialiser le store (utile pour les tests)
         */
        reset: () => set(state => {
          state.cart = [];
          state.selectedCustomer = null;
          state.paymentMethod = 'cash';
          state.showPaymentModal = false;
        }),
        
        /**
         * Obtenir l'état complet (pour debugging)
         */
        getState: () => get(),
      })),
      {
        name: 'pos-store', // Nom pour localStorage
        partialize: (state) => ({
          // Ne persister que les données importantes
          cashSession: state.cashSession,
          cashOperations: state.cashOperations,
          salesHistory: state.salesHistory,
        }),
      }
    ),
    {
      name: 'POS Store', // Nom pour Redux DevTools
    }
  )
);
