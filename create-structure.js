const fs = require('fs');
const path = require('path');

console.log('🚀 Création de la structure du projet POS...\n');

// Structure complète du projet
const structure = {
  'src': {
    'App.js': '',
    'index.js': '',
    'App.css': '',
    'index.css': '',
    'components': {
      'Layout': {
        'Header.jsx': '',
        'Sidebar.jsx': '',
        'Footer.jsx': '',
        'Navigation.jsx': ''
      },
      'Auth': {
        'LoginForm.jsx': '',
        'ProtectedRoute.jsx': ''
      },
      'common': {
        'Modal.jsx': '',
        'LoadingSpinner.jsx': '',
        'ErrorBoundary.jsx': '',
        'Toast.jsx': '',
        'ConfirmDialog.jsx': '',
        'DataTable.jsx': ''
      }
    },
    'modules': {
      'sales': {
        'SalesModule.jsx': '',
        'Cart.jsx': '',
        'ProductGrid.jsx': '',
        'PaymentModal.jsx': '',
        'Receipt.jsx': '',
        'QuickSale.jsx': ''
      },
      'inventory': {
        'InventoryModule.jsx': '',
        'ProductList.jsx': '',
        'StockAlerts.jsx': '',
        'InventoryModals.jsx': '',
        'StockMovements.jsx': '',
        'PurchaseOrders.jsx': '',
        'Suppliers.jsx': '',
        'ABCAnalysis.jsx': ''
      },
      'dashboard': {
        'DashboardModule.jsx': '',
        'StatCards.jsx': '',
        'SalesChart.jsx': '',
        'TopProducts.jsx': '',
        'RecentActivity.jsx': ''
      },
      'reports': {
        'ReportsModule.jsx': '',
        'SalesReport.jsx': '',
        'InventoryReport.jsx': '',
        'FinancialReport.jsx': ''
      },
      'employees': {
        'EmployeesModule.jsx': '',
        'EmployeeList.jsx': '',
        'EmployeeForm.jsx': '',
        'ShiftManagement.jsx': ''
      },
      'returns': {
        'ReturnsModule.jsx': '',
        'ReturnForm.jsx': '',
        'ReturnHistory.jsx': ''
      },
      'settings': {
        'SettingsModule.jsx': '',
        'GeneralSettings.jsx': '',
        'StoreSettings.jsx': '',
        'TaxSettings.jsx': ''
      },
      'customers': {
        'CustomersModule.jsx': '',
        'CustomerList.jsx': '',
        'LoyaltyProgram.jsx': ''
      }
    },
    'contexts': {
      'AuthContext.jsx': '',
      'AppContext.jsx': '',
      'CartContext.jsx': '',
      'ThemeContext.jsx': ''
    },
    'services': {
      'api.js': '',
      'supabase.js': '',
      'auth.service.js': '',
      'product.service.js': '',
      'sales.service.js': '',
      'inventory.service.js': ''
    },
    'utils': {
      'helpers.js': '',
      'constants.js': '',
      'validators.js': '',
      'formatters.js': '',
      'calculations.js': ''
    },
    'hooks': {
      'useAuth.js': '',
      'useCart.js': '',
      'useInventory.js': '',
      'useLocalStorage.js': '',
      'useDebounce.js': ''
    },
    'assets': {
      'images': {},
      'icons': {}
    },
    'styles': {},
    'config': {
      'routes.js': '',
      'permissions.js': '',
      'settings.js': ''
    }
  }
};

// Fonction récursive pour créer la structure
function createStructure(basePath, structure) {
  Object.entries(structure).forEach(([name, content]) => {
    const fullPath = path.join(basePath, name);
    
    if (typeof content === 'object' && Object.keys(content).length > 0) {
      // C'est un dossier
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`📁 Dossier créé: ${fullPath}`);
      }
      createStructure(fullPath, content);
    } else {
      // C'est un fichier
      if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, content);
        console.log(`📄 Fichier créé: ${fullPath}`);
      }
    }
  });
}

// Exécution
createStructure('.', structure);

// Compter les éléments créés
let fileCount = 0;
let folderCount = 0;

function countItems(basePath, structure) {
  Object.entries(structure).forEach(([name, content]) => {
    if (typeof content === 'object' && Object.keys(content).length > 0) {
      folderCount++;
      countItems(path.join(basePath, name), content);
    } else {
      fileCount++;
    }
  });
}

countItems('.', structure);

console.log('\n✅ Structure créée avec succès!');
console.log(`\n📊 Résumé:`);
console.log(`  - Dossiers créés: ${folderCount}`);
console.log(`  - Fichiers créés: ${fileCount}`);
console.log('\n🎉 Projet POS prêt!');
console.log('\nProchaines étapes:');
console.log('1. Copier le code de chaque module dans son fichier respectif');
console.log('2. Installer les dépendances: npm install lucide-react');
console.log('3. Lancer le projet: npm start');