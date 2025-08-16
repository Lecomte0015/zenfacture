import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { FileText, Users, TrendingUp, Shield } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'dashboard'>('home');

  if (currentView === 'dashboard') {
    return <Dashboard onBack={() => setCurrentView('home')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">ZenFacture</span>
            </div>
            <button
              onClick={() => setCurrentView('dashboard')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Commencer gratuitement
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
            Factures QR suisses
            <span className="text-blue-600"> simplifiées</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Créez et gérez vos factures QR conformes aux standards suisses en quelques clics. 
            Simple, rapide et professionnel.
          </p>
          <div className="mt-10">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              Créer ma première facture
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <FileText className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">QR-factures conformes</h3>
            <p className="text-gray-600">Génération automatique de QR codes selon les standards suisses</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <Users className="h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestion clients</h3>
            <p className="text-gray-600">Organisez vos clients et leurs informations facilement</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <TrendingUp className="h-12 w-12 text-purple-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Suivi financier</h3>
            <p className="text-gray-600">Tableau de bord avec statistiques et analyses</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <Shield className="h-12 w-12 text-red-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sécurisé</h3>
            <p className="text-gray-600">Vos données sont protégées et sauvegardées</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;