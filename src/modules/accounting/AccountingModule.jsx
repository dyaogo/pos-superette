import React, { useState } from 'react';
import { Receipt, TrendingUp } from 'lucide-react';
import ExpensesModule from './ExpensesModule';
import ProfitLossStatement from './ProfitLossStatement';

const AccountingModule = ({ currentStore, currentUser }) => {
  const [activeTab, setActiveTab] = useState('expenses');

  const tabs = [
    { id: 'expenses', name: 'Dépenses', icon: Receipt },
    { id: 'profit-loss', name: 'Compte de Résultat', icon: TrendingUp },
  ];

  return (
    <div className="w-full">
      {/* Navigation à onglets avec design moderne */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-3 px-6 py-4 border-b-3 font-semibold
                    transition-all duration-200 ease-in-out transform
                    ${isActive
                      ? 'border-blue-600 text-blue-700 bg-white shadow-md -mb-px scale-105'
                      : 'border-transparent text-gray-600 hover:text-blue-600 hover:bg-white/50'
                    }
                  `}
                  style={{
                    borderBottomWidth: isActive ? '3px' : '0px',
                  }}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-sm">{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenu avec transition */}
      <div className="animate-fadeIn">
        {activeTab === 'expenses' && (
          <ExpensesModule currentStore={currentStore} currentUser={currentUser} />
        )}
        {activeTab === 'profit-loss' && (
          <ProfitLossStatement currentStore={currentStore} />
        )}
      </div>

      {/* Styles pour les animations */}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default AccountingModule;
