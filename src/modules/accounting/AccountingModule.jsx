import React, { useState } from 'react';
import { Receipt, TrendingUp, Sparkles } from 'lucide-react';
import ExpensesView from './ExpensesView';
import ProfitLossView from './ProfitLossView';

const AccountingModule = ({ currentStore, currentUser }) => {
  const [activeTab, setActiveTab] = useState('profit-loss');

  const tabs = [
    { id: 'profit-loss', name: 'Compte de Résultat', icon: TrendingUp, gradient: 'from-violet-500 to-purple-600' },
    { id: 'expenses', name: 'Dépenses', icon: Receipt, gradient: 'from-blue-500 to-cyan-600' },
  ];

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20 min-h-screen">
      {/* Header ultra-moderne */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/30 animate-pulse">
            <Sparkles className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
              Comptabilité
            </h1>
            <p className="text-gray-500 font-medium">Gérez vos finances en toute simplicité</p>
          </div>
        </div>
      </div>

      {/* Navigation moderne avec gradients */}
      <div className="mb-8 flex gap-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                group relative flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-base
                transition-all duration-300 transform hover:scale-105 hover:shadow-2xl
                ${isActive
                  ? `bg-gradient-to-r ${tab.gradient} text-white shadow-xl`
                  : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white border-2 border-gray-200'
                }
              `}
            >
              {isActive && (
                <div className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} opacity-30 blur-xl rounded-2xl`}></div>
              )}
              <Icon size={22} strokeWidth={2.5} className="relative z-10" />
              <span className="relative z-10">{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Contenu avec animation */}
      <div className="transition-all duration-500 ease-in-out">
        {activeTab === 'expenses' && (
          <div className="animate-fadeIn">
            <ExpensesView currentStore={currentStore} currentUser={currentUser} />
          </div>
        )}
        {activeTab === 'profit-loss' && (
          <div className="animate-fadeIn">
            <ProfitLossView currentStore={currentStore} />
          </div>
        )}
      </div>

      <style jsx>{`
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

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AccountingModule;
