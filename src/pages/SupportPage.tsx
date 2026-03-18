import React, { useState } from 'react';
import { LifebuoyIcon, ChatBubbleLeftRightIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import SupportTickets from '../components/support/SupportTickets';

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState('tickets');

  const tabs = [
    { name: 'Mes tickets', id: 'tickets', icon: ChatBubbleLeftRightIcon },
    { name: 'Centre d\'aide', id: 'help', icon: DocumentTextIcon },
  ];

  return (
    <div className="space-y-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Support
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Obtenez de l'aide et contactez notre équipe de support
          </p>
        </div>
        <div className="mt-4 flex md:mt-0">
          <button
            type="button"
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => setActiveTab('new-ticket')}
          >
            <LifebuoyIcon className="-ml-1 mr-2 h-5 w-5" />
            Nouveau ticket
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <tab.icon className="mr-2 h-5 w-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="px-4 py-5 sm:p-6">
          {activeTab === 'tickets' && <SupportTickets />}
          {activeTab === 'new-ticket' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Créer un nouveau ticket de support
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Notre équipe de support vous répondra dans les plus brefs délais.
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                    Sujet
                  </label>
                  <input
                    type="text"
                    name="subject"
                    id="subject"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Décrivez brièvement votre problème"
                  />
                </div>
                
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                    Priorité
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    defaultValue="medium"
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    Message
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="message"
                      name="message"
                      rows={8}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                      placeholder="Décrivez votre problème en détail..."
                      defaultValue={''}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="bg-blue-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Envoyer la demande
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'help' && (
            <div className="prose max-w-none">
              <h3>Centre d'aide</h3>
              <p>
                Consultez notre centre d'aide pour trouver des réponses aux questions fréquentes.
              </p>
              
              <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    title: 'Premiers pas',
                    description: 'Découvrez comment configurer votre compte et commencer à utiliser ZenFacture.',
                    link: '/help/getting-started',
                  },
                  {
                    title: 'Facturation',
                    description: 'Tout ce que vous devez savoir sur la création et la gestion des factures.',
                    link: '/help/billing',
                  },
                  {
                    title: 'Clients',
                    description: 'Gérez vos clients et leurs informations de facturation.',
                    link: '/help/clients',
                  },
                  {
                    title: 'Paiements',
                    description: 'Acceptez les paiements en ligne et gérez les paiements reçus.',
                    link: '/help/payments',
                  },
                  {
                    title: 'Rapports',
                    description: 'Générez des rapports pour suivre votre activité et vos revenus.',
                    link: '/help/reports',
                  },
                  {
                    title: 'Paramètres',
                    description: 'Personnalisez votre compte et vos paramètres.',
                    link: '/help/settings',
                  },
                ].map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h4 className="text-lg font-medium text-gray-900 mb-2">{item.title}</h4>
                    <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                    <a 
                      href={item.link} 
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      En savoir plus →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
