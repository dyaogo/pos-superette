// src/utils/validation.js
import { AppError, ERROR_TYPES, ERROR_LEVELS } from './errorHandler';
// Dans src/utils/validation.js, ligne 1 :
import React, { useState } from 'react';

/**
 * Système de validation des données utilisateur
 */

// Règles de validation prédéfinies
export const VALIDATION_RULES = {
  required: (value, fieldName) => {
    if (value === null || value === undefined || value === '') {
      throw new AppError(
        `Le champ "${fieldName}" est obligatoire`,
        ERROR_TYPES.VALIDATION,
        ERROR_LEVELS.MEDIUM,
        { field: fieldName, rule: 'required' }
      );
    }
    return true;
  },

  email: (value, fieldName) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      throw new AppError(
        `L'email "${value}" n'est pas valide`,
        ERROR_TYPES.VALIDATION,
        ERROR_LEVELS.MEDIUM,
        { field: fieldName, rule: 'email', value }
      );
    }
    return true;
  },

  phone: (value, fieldName) => {
    const phoneRegex = /^(\+\d{1,3}\s?)?\d{8,15}$/;
    if (value && !phoneRegex.test(value.replace(/\s/g, ''))) {
      throw new AppError(
        `Le numéro de téléphone "${value}" n'est pas valide`,
        ERROR_TYPES.VALIDATION,
        ERROR_LEVELS.MEDIUM,
        { field: fieldName, rule: 'phone', value }
      );
    }
    return true;
  },

  number: (value, fieldName) => {
    if (value !== null && value !== undefined && value !== '') {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        throw new AppError(
          `"${value}" doit être un nombre valide`,
          ERROR_TYPES.VALIDATION,
          ERROR_LEVELS.MEDIUM,
          { field: fieldName, rule: 'number', value }
        );
      }
    }
    return true;
  },

  positiveNumber: (value, fieldName) => {
    VALIDATION_RULES.number(value, fieldName);
    if (value !== null && value !== undefined && value !== '') {
      const numValue = Number(value);
      if (numValue < 0) {
        throw new AppError(
          `"${fieldName}" doit être un nombre positif`,
          ERROR_TYPES.VALIDATION,
          ERROR_LEVELS.MEDIUM,
          { field: fieldName, rule: 'positiveNumber', value }
        );
      }
    }
    return true;
  },

  minLength: (minLength) => (value, fieldName) => {
    if (value && value.length < minLength) {
      throw new AppError(
        `"${fieldName}" doit contenir au moins ${minLength} caractères`,
        ERROR_TYPES.VALIDATION,
        ERROR_LEVELS.MEDIUM,
        { field: fieldName, rule: 'minLength', value, minLength }
      );
    }
    return true;
  },

  maxLength: (maxLength) => (value, fieldName) => {
    if (value && value.length > maxLength) {
      throw new AppError(
        `"${fieldName}" ne peut pas dépasser ${maxLength} caractères`,
        ERROR_TYPES.VALIDATION,
        ERROR_LEVELS.MEDIUM,
        { field: fieldName, rule: 'maxLength', value, maxLength }
      );
    }
    return true;
  },

  min: (minValue) => (value, fieldName) => {
    VALIDATION_RULES.number(value, fieldName);
    if (value !== null && value !== undefined && value !== '') {
      const numValue = Number(value);
      if (numValue < minValue) {
        throw new AppError(
          `"${fieldName}" doit être supérieur ou égal à ${minValue}`,
          ERROR_TYPES.VALIDATION,
          ERROR_LEVELS.MEDIUM,
          { field: fieldName, rule: 'min', value, minValue }
        );
      }
    }
    return true;
  },

  max: (maxValue) => (value, fieldName) => {
    VALIDATION_RULES.number(value, fieldName);
    if (value !== null && value !== undefined && value !== '') {
      const numValue = Number(value);
      if (numValue > maxValue) {
        throw new AppError(
          `"${fieldName}" doit être inférieur ou égal à ${maxValue}`,
          ERROR_TYPES.VALIDATION,
          ERROR_LEVELS.MEDIUM,
          { field: fieldName, rule: 'max', value, maxValue }
        );
      }
    }
    return true;
  },

  barcode: (value, fieldName) => {
    if (value) {
      // Validation basique pour code-barres (chiffres seulement, longueur appropriée)
      const barcodeRegex = /^\d{8,13}$/;
      if (!barcodeRegex.test(value)) {
        throw new AppError(
          `Le code-barres doit contenir entre 8 et 13 chiffres`,
          ERROR_TYPES.VALIDATION,
          ERROR_LEVELS.MEDIUM,
          { field: fieldName, rule: 'barcode', value }
        );
      }
    }
    return true;
  },

  currency: (value, fieldName) => {
    if (value !== null && value !== undefined && value !== '') {
      const numValue = Number(value);
      if (isNaN(numValue) || numValue < 0) {
        throw new AppError(
          `"${fieldName}" doit être un montant valide et positif`,
          ERROR_TYPES.VALIDATION,
          ERROR_LEVELS.MEDIUM,
          { field: fieldName, rule: 'currency', value }
        );
      }
    }
    return true;
  }
};

/**
 * Schémas de validation pour les entités POS
 */
export const VALIDATION_SCHEMAS = {
  product: {
    name: [VALIDATION_RULES.required, VALIDATION_RULES.minLength(2), VALIDATION_RULES.maxLength(100)],
    price: [VALIDATION_RULES.required, VALIDATION_RULES.currency],
    costPrice: [VALIDATION_RULES.currency],
    stock: [VALIDATION_RULES.positiveNumber],
    minStock: [VALIDATION_RULES.positiveNumber],
    maxStock: [VALIDATION_RULES.positiveNumber],
    barcode: [VALIDATION_RULES.barcode],
    category: [VALIDATION_RULES.maxLength(50)]
  },

  customer: {
    name: [VALIDATION_RULES.required, VALIDATION_RULES.minLength(2), VALIDATION_RULES.maxLength(100)],
    email: [VALIDATION_RULES.email],
    phone: [VALIDATION_RULES.phone],
    address: [VALIDATION_RULES.maxLength(200)]
  },

  sale: {
    items: [VALIDATION_RULES.required],
    paymentMethod: [VALIDATION_RULES.required],
    amountReceived: [VALIDATION_RULES.required, VALIDATION_RULES.currency],
    customerId: [VALIDATION_RULES.required, VALIDATION_RULES.positiveNumber]
  },

  credit: {
    customerId: [VALIDATION_RULES.required, VALIDATION_RULES.positiveNumber],
    amount: [VALIDATION_RULES.required, VALIDATION_RULES.currency, VALIDATION_RULES.min(1)],
    description: [VALIDATION_RULES.maxLength(200)]
  },

  settings: {
    storeName: [VALIDATION_RULES.required, VALIDATION_RULES.minLength(2), VALIDATION_RULES.maxLength(100)],
    currency: [VALIDATION_RULES.required, VALIDATION_RULES.maxLength(10)],
    taxRate: [VALIDATION_RULES.positiveNumber, VALIDATION_RULES.max(100)],
    pointsPerPurchase: [VALIDATION_RULES.positiveNumber]
  }
};

/**
 * Classe principale de validation
 */
export class Validator {
  /**
   * Valider un objet selon un schéma
   */
  static validate(data, schema, options = {}) {
    const errors = [];
    const { skipMissing = false, fieldPrefix = '' } = options;

    for (const [fieldName, rules] of Object.entries(schema)) {
      const fullFieldName = fieldPrefix ? `${fieldPrefix}.${fieldName}` : fieldName;
      const value = data[fieldName];

      // Ignorer les champs manquants si skipMissing est true
      if (skipMissing && (value === undefined || value === null)) {
        continue;
      }

      try {
        // Appliquer chaque règle
        for (const rule of rules) {
          rule(value, fullFieldName);
        }
      } catch (error) {
        errors.push({
          field: fieldName,
          message: error.message,
          value: value
        });
      }
    }

    if (errors.length > 0) {
      const errorMessage = errors.map(e => e.message).join(', ');
      throw new AppError(
        `Erreurs de validation: ${errorMessage}`,
        ERROR_TYPES.VALIDATION,
        ERROR_LEVELS.MEDIUM,
        { errors, data }
      );
    }

    return true;
  }

  /**
   * Valider un produit
   */
  static validateProduct(product, isUpdate = false) {
    const schema = isUpdate 
      ? { ...VALIDATION_SCHEMAS.product }
      : VALIDATION_SCHEMAS.product;

    // Validation personnalisée pour les prix
    if (product.price && product.costPrice && Number(product.price) < Number(product.costPrice)) {
      throw new AppError(
        'Le prix de vente ne peut pas être inférieur au prix d\'achat',
        ERROR_TYPES.VALIDATION,
        ERROR_LEVELS.MEDIUM,
        { field: 'price', price: product.price, costPrice: product.costPrice }
      );
    }

    // Validation des stocks min/max
    if (product.minStock && product.maxStock && Number(product.minStock) > Number(product.maxStock)) {
      throw new AppError(
        'Le stock minimum ne peut pas être supérieur au stock maximum',
        ERROR_TYPES.VALIDATION,
        ERROR_LEVELS.MEDIUM,
        { field: 'minStock', minStock: product.minStock, maxStock: product.maxStock }
      );
    }

    return this.validate(product, schema, { skipMissing: isUpdate });
  }

  /**
   * Valider un client
   */
  static validateCustomer(customer, isUpdate = false) {
    return this.validate(customer, VALIDATION_SCHEMAS.customer, { skipMissing: isUpdate });
  }

  /**
   * Valider une vente
   */
  static validateSale(sale) {
    // Validation du schéma de base
    this.validate(sale, VALIDATION_SCHEMAS.sale);

    // Validations métier spécifiques
    if (!Array.isArray(sale.items) || sale.items.length === 0) {
      throw new AppError(
        'La vente doit contenir au moins un article',
        ERROR_TYPES.VALIDATION,
        ERROR_LEVELS.MEDIUM,
        { field: 'items' }
      );
    }

    // Valider chaque article
    sale.items.forEach((item, index) => {
      if (!item.name || !item.price || !item.quantity) {
        throw new AppError(
          `Article ${index + 1}: nom, prix et quantité sont obligatoires`,
          ERROR_TYPES.VALIDATION,
          ERROR_LEVELS.MEDIUM,
          { field: `items[${index}]`, item }
        );
      }

      if (item.quantity <= 0) {
        throw new AppError(
          `Article "${item.name}": la quantité doit être positive`,
          ERROR_TYPES.VALIDATION,
          ERROR_LEVELS.MEDIUM,
          { field: `items[${index}].quantity`, item }
        );
      }

      if (item.price <= 0) {
        throw new AppError(
          `Article "${item.name}": le prix doit être positif`,
          ERROR_TYPES.VALIDATION,
          ERROR_LEVELS.MEDIUM,
          { field: `items[${index}].price`, item }
        );
      }
    });

    // Validation du montant reçu pour les paiements en espèces
    if (sale.paymentMethod === 'cash') {
      const total = sale.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      if (Number(sale.amountReceived) < total) {
        throw new AppError(
          `Le montant reçu (${sale.amountReceived}) est insuffisant (total: ${total})`,
          ERROR_TYPES.VALIDATION,
          ERROR_LEVELS.MEDIUM,
          { field: 'amountReceived', received: sale.amountReceived, total }
        );
      }
    }

    return true;
  }

  /**
   * Valider un crédit
   */
  static validateCredit(credit) {
    this.validate(credit, VALIDATION_SCHEMAS.credit);

    // Validation métier: montant minimum
    if (Number(credit.amount) < 100) {
      throw new AppError(
        'Le montant du crédit doit être d\'au moins 100',
        ERROR_TYPES.VALIDATION,
        ERROR_LEVELS.MEDIUM,
        { field: 'amount', amount: credit.amount }
      );
    }

    return true;
  }

  /**
   * Valider les paramètres
   */
  static validateSettings(settings) {
    this.validate(settings, VALIDATION_SCHEMAS.settings);

    // Validation du taux de taxe
    if (settings.taxRate && (Number(settings.taxRate) < 0 || Number(settings.taxRate) > 50)) {
      throw new AppError(
        'Le taux de taxe doit être entre 0 et 50%',
        ERROR_TYPES.VALIDATION,
        ERROR_LEVELS.MEDIUM,
        { field: 'taxRate', taxRate: settings.taxRate }
      );
    }

    return true;
  }

  /**
   * Valider les données d'import
   */
  static validateImportData(data, type) {
    if (!data || typeof data !== 'object') {
      throw new AppError(
        'Les données d\'import doivent être un objet JSON valide',
        ERROR_TYPES.VALIDATION,
        ERROR_LEVELS.HIGH,
        { data }
      );
    }

    switch (type) {
      case 'products':
        if (!Array.isArray(data)) {
          throw new AppError(
            'Les données de produits doivent être un tableau',
            ERROR_TYPES.VALIDATION,
            ERROR_LEVELS.HIGH
          );
        }
        data.forEach((product, index) => {
          try {
            this.validateProduct(product);
          } catch (error) {
            throw new AppError(
              `Produit ${index + 1}: ${error.message}`,
              ERROR_TYPES.VALIDATION,
              ERROR_LEVELS.HIGH,
              { productIndex: index, product }
            );
          }
        });
        break;

      case 'customers':
        if (!Array.isArray(data)) {
          throw new AppError(
            'Les données de clients doivent être un tableau',
            ERROR_TYPES.VALIDATION,
            ERROR_LEVELS.HIGH
          );
        }
        data.forEach((customer, index) => {
          try {
            this.validateCustomer(customer);
          } catch (error) {
            throw new AppError(
              `Client ${index + 1}: ${error.message}`,
              ERROR_TYPES.VALIDATION,
              ERROR_LEVELS.HIGH,
              { customerIndex: index, customer }
            );
          }
        });
        break;

      default:
        throw new AppError(
          `Type d'import non supporté: ${type}`,
          ERROR_TYPES.VALIDATION,
          ERROR_LEVELS.HIGH,
          { type }
        );
    }

    return true;
  }
}

/**
 * Hook React pour la validation en temps réel
 */
export const useValidation = (schema) => {
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(true);

  const validateField = (fieldName, value) => {
    const rules = schema[fieldName];
    if (!rules) return true;

    try {
      for (const rule of rules) {
        rule(value, fieldName);
      }
      
      // Supprimer l'erreur si la validation réussit
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
      
      return true;
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: error.message
      }));
      return false;
    }
  };

  const validateAll = (data) => {
    try {
      Validator.validate(data, schema);
      setErrors({});
      setIsValid(true);
      return true;
    } catch (error) {
      const fieldErrors = {};
      if (error.context?.errors) {
        error.context.errors.forEach(err => {
          fieldErrors[err.field] = err.message;
        });
      }
      setErrors(fieldErrors);
      setIsValid(false);
      return false;
    }
  };

  const clearErrors = () => {
    setErrors({});
    setIsValid(true);
  };

  return {
    errors,
    isValid,
    validateField,
    validateAll,
    clearErrors
  };
};

/**
 * Composant d'affichage d'erreur de champ
 */
export const FieldError = ({ error, className = '' }) => {
  if (!error) return null;

  return (
    <div className={`field-error ${className}`} style={{
      color: '#dc2626',
      fontSize: '12px',
      marginTop: '4px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    }}>
      <span>⚠️</span>
      <span>{error}</span>
    </div>
  );
};

export default Validator;
