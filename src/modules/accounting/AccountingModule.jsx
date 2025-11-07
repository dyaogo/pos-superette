import React, { useState } from 'react';
import { Receipt, TrendingUp } from 'lucide-react';
import ExpensesView from './ExpensesView';
import ProfitLossView from './ProfitLossView';

const AccountingModule = ({ currentStore, currentUser }) => {
  const [activeTab, setActiveTab] = useState('expenses');

  const tabs = [
    { id: 'expenses', name: 'Dépenses', icon: Receipt },
    { id: 'profit-loss', name: 'Compte de Résultat', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-3 px-6 py-4 font-semibold text-sm
                    transition-all duration-200
                    ${isActive
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'expenses' && (
          <ExpensesView currentStore={currentStore} currentUser={currentUser} />
        )}
        {activeTab === 'profit-loss' && (
          <ProfitLossView currentStore={currentStore} />
        )}
      </div>
    </div>
  );
};

export default AccountingModule;
