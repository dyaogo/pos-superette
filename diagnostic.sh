#!/bin/bash

# Script de diagnostic pour vérifier l'installation des fichiers modernisés

echo "🔍 DIAGNOSTIC MODULE COMPTABILITÉ"
echo "=================================="
echo ""

# Vérifier si les fichiers existent
echo "📁 Vérification des fichiers..."
if [ -f "src/modules/accounting/ExpensesModule.jsx" ]; then
    echo "✅ ExpensesModule.jsx existe"
else
    echo "❌ ExpensesModule.jsx MANQUANT"
fi

if [ -f "src/modules/accounting/ProfitLossStatement.jsx" ]; then
    echo "✅ ProfitLossStatement.jsx existe"
else
    echo "❌ ProfitLossStatement.jsx MANQUANT"
fi

echo ""
echo "🔎 Vérification du contenu..."

# Vérifier si c'est la version modernisée
if grep -q "Filter, Search, Calendar" src/modules/accounting/ExpensesModule.jsx 2>/dev/null; then
    echo "✅ ExpensesModule.jsx = VERSION MODERNE"
else
    echo "❌ ExpensesModule.jsx = ANCIENNE VERSION"
fi

if grep -q "from-gray-50 to-blue-50" src/modules/accounting/ExpensesModule.jsx 2>/dev/null; then
    echo "✅ Gradients détectés dans ExpensesModule"
else
    echo "❌ Gradients ABSENTS dans ExpensesModule"
fi

echo ""
echo "📊 Statistiques des fichiers..."
echo "ExpensesModule.jsx: $(wc -l < src/modules/accounting/ExpensesModule.jsx 2>/dev/null || echo 0) lignes"
echo "ProfitLossStatement.jsx: $(wc -l < src/modules/accounting/ProfitLossStatement.jsx 2>/dev/null || echo 0) lignes"

echo ""
echo "💡 Attendu:"
echo "   ExpensesModule.jsx: ~700 lignes"
echo "   ProfitLossStatement.jsx: ~550 lignes"

echo ""
echo "=================================="
echo "Si les lignes sont < 100, les fichiers ne sont PAS les bons !"
