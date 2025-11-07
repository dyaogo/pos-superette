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
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      {/* Navigation à onglets avec design ultra-moderne */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-xl">
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
                    flex items-center gap-3 px-8 py-4 font-bold
                    transition-all duration-300 ease-out transform
                    ${isActive
                      ? 'bg-white text-blue-700 shadow-2xl -mb-px scale-105 border-b-4 border-blue-600'
                      : 'text-white/80 hover:text-white hover:bg-white/20 hover:scale-102'
                    }
                    rounded-t-xl
                  `}
                >
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? '' : ''} />
                  <span className="text-base">{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenu avec transition animée */}
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
          animation: fadeIn 0.4s ease-in;
        }

        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
};

export default AccountingModule;
