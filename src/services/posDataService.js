// src/services/posDataService.js
/**
 * Service de gestion des données POS
 * Centralise la logique de validation et synchronisation
 */
export class POSDataService {
  constructor() {
    this.version = '2.0.0';
  }

  /**
   * Valider une vente avant traitement
   */
  validateSale(saleData, cartStats, cashSession) {
    const errors = [];
    
    // Vérifications de base
    if (!cashSession) {
      errors.push('Session de caisse fermée');
    }
    
    if (!saleData.items || saleData.items.length === 0) {
      errors.push('Panier vide');
    }
    
    if (!saleData.paymentMethod) {
      errors.push('Mode de paiement non spécifié');
    }
    
    // Vérifications spécifiques au paiement
    if (saleData.paymentMethod === 'cash') {
      if (!saleData.amountReceived) {
        errors.push('Montant reçu non spécifié');
      } else if (saleData.amountReceived < cartStats.total) {
        errors.push('Montant insuffisant');
      }
    }
    
    if (saleData.paymentMethod === 'credit') {
      if (!saleData.customerId || saleData.customerId === 1) {
        errors.push('Client requis pour le crédit');
      }
    }
    
    // Vérifications des montants
    if (cartStats.total <= 0) {
      errors.push('Montant de vente invalide');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * Normaliser les données de vente pour assurer la compatibilité
   */
  normalizeSaleData(saleData, cartStats, cashSession, selectedCustomer) {
    const now = new Date().toISOString();
    const receiptNumber = `REC${Date.now().toString().slice(-6)}`;
    
    return {
      // IDs et références
      id: Date.now(),
      receiptNumber,
      
      // Horodatage (multiples formats pour compatibilité)
      date: now,
      createdAt: now,
      timestamp: now,
      
      // Client
      customerId: selectedCustomer?.id || 1,
      customerName: selectedCustomer?.name || 'Client Comptant',
      customer: selectedCustomer,
      
      // Articles (format compatible avec l'existant)
      items: saleData.items.map(item => ({
        id: item.id,
        name: item.name,
        sku: item.sku || '',
        barcode: item.barcode || '',
        price: this.roundAmount(item.price),
        quantity: parseInt(item.quantity) || 1,
        total: this.roundAmount(item.price * item.quantity),
        subtotal: this.roundAmount(item.price * item.quantity),
        category: item.category || 'Autre'
      })),
      
      // Montants (tous formats)
      subtotal: this.roundAmount(cartStats.subtotal),
      totalAmount: this.roundAmount(cartStats.subtotal),
      tax: this.roundAmount(cartStats.taxAmount),
      totalTax: this.roundAmount(cartStats.taxAmount),
      total: this.roundAmount(cartStats.total),
      finalTotal: this.roundAmount(cartStats.total),
      
      // Paiement
      paymentMethod: saleData.paymentMethod,
      amountReceived: this.roundAmount(saleData.amountReceived || cartStats.total),
      change: this.roundAmount(Math.max(0, (saleData.amountReceived || 0) - cartStats.total)),
      changeAmount: this.roundAmount(Math.max(0, (saleData.amountReceived || 0) - cartStats.total)),
      
      // Métadonnées
      cashSession: cashSession.id,
      cashSessionId: cashSession.id,
      operatorId: 'caissier_1',
      storeId: 'main_store',
      
      // État
      status: 'completed',
      refunded: false,
      refundedAt: null
    };
  }

  /**
   * Valider les données de session de caisse
   */
  validateCashSession(sessionData) {
    const errors = [];
    
    if (!sessionData.initialAmount || sessionData.initialAmount < 0) {
      errors.push('Montant initial invalide');
    }
    
    if (!sessionData.openedBy || sessionData.openedBy.trim() === '') {
      errors.push('Opérateur non spécifié');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculer les statistiques d'une session
   */
  calculateSessionStats(sessionSales, cashOperations = []) {
    const validSales = sessionSales.filter(sale => 
      sale && 
      sale.total > 0 && 
      sale.paymentMethod && 
      typeof sale.paymentMethod === 'string'
    );
    
    const cashSales = validSales.filter(s => s.paymentMethod === 'cash');
    const cardSales = validSales.filter(s => s.paymentMethod === 'card');
    const creditSales = validSales.filter(s => s.paymentMethod === 'credit');
    
    const cashOperationsTotal = cashOperations.reduce((total, op) => {
      if (op.type === 'in') return total + op.amount;
      if (op.type === 'out') return total - op.amount;
      return total;
    }, 0);
    
    return {
      totalSales: this.roundAmount(validSales.reduce((sum, s) => sum + s.total, 0)),
      totalTransactions: validSales.length,
      
      cashSales: this.roundAmount(cashSales.reduce((sum, s) => sum + s.total, 0)),
      cardSales: this.roundAmount(cardSales.reduce((sum, s) => sum + s.total, 0)),
      creditSales: this.roundAmount(creditSales.reduce((sum, s) => sum + s.total, 0)),
      
      cashTransactions: cashSales.length,
      cardTransactions: cardSales.length,
      creditTransactions: creditSales.length,
      
      averageTicket: validSales.length > 0 
        ? this.roundAmount(validSales.reduce((sum, s) => sum + s.total, 0) / validSales.length)
        : 0,
      
      cashOperationsTotal: this.roundAmount(cashOperationsTotal)
    };
  }

  /**
   * Générer un rapport de fermeture de caisse
   */
  generateClosingReport(cashSession, sessionSales, actualCash, notes = '', operator = 'Caissier') {
    const stats = this.calculateSessionStats(sessionSales, cashSession.operations || []);
    const expectedCash = cashSession.initialAmount + stats.cashSales + stats.cashOperationsTotal;
    const difference = actualCash - expectedCash;
    
    return {
      sessionId: cashSession.id,
      openedAt: cashSession.openedAt,
      closedAt: new Date().toISOString(),
      openedBy: cashSession.openedBy,
      closedBy: operator,
      
      // Montants
      initialAmount: this.roundAmount(cashSession.initialAmount),
      expectedCash: this.roundAmount(expectedCash),
      actualCash: this.roundAmount(actualCash),
      difference: this.roundAmount(difference),
      
      // Statistiques
      ...stats,
      
      // Métadonnées
      notes: notes.trim(),
      operations: cashSession.operations || [],
      
      // Validation
      balanced: Math.abs(difference) < 0.01, // Tolérance de 1 centime
      status: Math.abs(difference) < 0.01 ? 'balanced' : difference > 0 ? 'surplus' : 'shortage'
    };
  }

  /**
   * Vérifier l'intégrité des données
   */
  validateDataIntegrity(salesHistory = []) {
    const issues = [];
    const warnings = [];
    
    salesHistory.forEach((sale, index) => {
      if (!sale.id) {
        issues.push(`Vente ${index}: ID manquant`);
      }
      
      if (!sale.total || sale.total <= 0) {
        issues.push(`Vente ${sale.id || index}: Montant total invalide`);
      }
      
      if (!sale.date && !sale.createdAt) {
        issues.push(`Vente ${sale.id || index}: Date manquante`);
      }
      
      if (!sale.paymentMethod) {
        warnings.push(`Vente ${sale.id || index}: Mode de paiement non spécifié`);
      }
      
      if (!sale.items || !Array.isArray(sale.items) || sale.items.length === 0) {
        issues.push(`Vente ${sale.id || index}: Articles manquants`);
      }
    });
    
    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      summary: {
        totalSales: salesHistory.length,
        validSales: salesHistory.filter(s => s.id && s.total > 0).length,
        issueCount: issues.length,
        warningCount: warnings.length
      }
    };
  }

  /**
   * Synchroniser avec le localStorage (pour compatibilité)
   */
  syncWithLocalStorage(cashSession, cashOperations) {
    try {
      if (cashSession) {
        localStorage.setItem('cash_session_v2', JSON.stringify(cashSession));
      } else {
        localStorage.removeItem('cash_session_v2');
      }
      
      if (cashOperations && cashOperations.length > 0) {
        localStorage.setItem('cash_operations_v2', JSON.stringify(cashOperations));
      } else {
        localStorage.removeItem('cash_operations_v2');
      }
    } catch (error) {
      console.warn('Erreur sync localStorage:', error);
    }
  }

  /**
   * Charger depuis localStorage
   */
  loadFromLocalStorage() {
    try {
      const session = localStorage.getItem('cash_session_v2');
      const operations = localStorage.getItem('cash_operations_v2');
      
      return {
        cashSession: session ? JSON.parse(session) : null,
        cashOperations: operations ? JSON.parse(operations) : []
      };
    } catch (error) {
      console.warn('Erreur chargement localStorage:', error);
      return {
        cashSession: null,
        cashOperations: []
      };
    }
  }

  /**
   * Nettoyer les données corrompues
   */
  cleanupCorruptedData(salesHistory = []) {
    return salesHistory.filter(sale => {
      // Garder seulement les ventes avec des données minimales valides
      return sale && 
             sale.id && 
             sale.total && 
             sale.total > 0 &&
             (sale.date || sale.createdAt) &&
             sale.items &&
             Array.isArray(sale.items);
    }).map(sale => {
      // Normaliser les montants
      return {
        ...sale,
        total: this.roundAmount(sale.total),
        subtotal: this.roundAmount(sale.subtotal || sale.totalAmount || 0),
        tax: this.roundAmount(sale.tax || sale.totalTax || 0)
      };
    });
  }

  /**
   * Arrondir les montants à 2 décimales
   */
  roundAmount(amount) {
    return Math.round((parseFloat(amount) || 0) * 100) / 100;
  }

  /**
   * Formater un montant pour affichage
   */
  formatAmount(amount, currency = 'FCFA') {
    return `${this.roundAmount(amount).toLocaleString()} ${currency}`;
  }

  /**
   * Générer un numéro de reçu unique
   */
  generateReceiptNumber(prefix = 'REC') {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp.slice(-6)}${random}`;
  }

  /**
   * Vérifier si deux ventes sont identiques (pour éviter les doublons)
   */
  areSalesIdentical(sale1, sale2) {
    return sale1.id === sale2.id ||
           (sale1.receiptNumber && sale1.receiptNumber === sale2.receiptNumber) ||
           (Math.abs(new Date(sale1.date || sale1.createdAt) - new Date(sale2.date || sale2.createdAt)) < 1000 &&
            sale1.total === sale2.total &&
            sale1.customerId === sale2.customerId);
  }

  /**
   * Obtenir des statistiques globales
   */
  getGlobalStats(salesHistory = []) {
    const validSales = this.cleanupCorruptedData(salesHistory);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    const todaySales = validSales.filter(sale => 
      new Date(sale.date || sale.createdAt) >= todayStart
    );
    
    const weekSales = validSales.filter(sale => 
      new Date(sale.date || sale.createdAt) >= weekStart
    );
    
    return {
      all: {
        count: validSales.length,
        total: this.roundAmount(validSales.reduce((sum, s) => sum + s.total, 0)),
        average: validSales.length > 0 ? this.roundAmount(validSales.reduce((sum, s) => sum + s.total, 0) / validSales.length) : 0
      },
      today: {
        count: todaySales.length,
        total: this.roundAmount(todaySales.reduce((sum, s) => sum + s.total, 0)),
        average: todaySales.length > 0 ? this.roundAmount(todaySales.reduce((sum, s) => sum + s.total, 0) / todaySales.length) : 0
      },
      week: {
        count: weekSales.length,
        total: this.roundAmount(weekSales.reduce((sum, s) => sum + s.total, 0)),
        average: weekSales.length > 0 ? this.roundAmount(weekSales.reduce((sum, s) => sum + s.total, 0) / weekSales.length) : 0
      }
    };
  }
}

// Instance singleton
export const posDataService = new POSDataService();
export default posDataService;
