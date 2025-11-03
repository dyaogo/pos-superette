import React, { useState } from 'react';
import { Calculator, Receipt, TrendingUp, FileText } from 'lucide-react';
import ExpensesModule from './ExpensesModule';
import ProfitLossStatement from './ProfitLossStatement';

const AccountingModule = ({ currentStore, currentUser }) => {
  const [activeTab, setActiveTab] = useState('expenses');

  const tabs = [
    { id: 'expenses', name: 'Dépenses', icon: Receipt },
    { id: 'profit-loss', name: 'Compte de Résultat', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation à onglets */}
      <div className="bg-white border-b">
        <div className="px-6">
          <div className="flex gap-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 border-b-2 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon size={20} />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div>
        {activeTab === 'expenses' && (
          <ExpensesModule currentStore={currentStore} currentUser={currentUser} />
        )}
        {activeTab === 'profit-loss' && (
          <ProfitLossStatement currentStore={currentStore} />
        )}
      </div>
    </div>
  );
};

export default AccountingModule;
