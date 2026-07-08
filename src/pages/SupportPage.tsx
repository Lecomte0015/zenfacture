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
            Un blocage, une question ? Notre équipe est là pour vous aider.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0">
          <button
            type="button"
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            onClick={() => setActiveTab('new-ticket')}
          >
            <LifebuoyIcon className="-ml-1 mr-2 h-5 w-5" />
            Nouveau ticket
          </button>
        </div>
      </div>

      <div className="bg-white shadow-card overflow-hidden rounded-2xl">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
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
                  Décrivez-nous votre situation
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Plus vous nous donnez de détails, plus vite on pourra vous aider. On revient généralement vers vous sous 24h ouvrées.
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
                    className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
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
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-lg"
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
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border border-gray-300 rounded-lg"
                      placeholder="Décrivez votre problème en détail..."
                      defaultValue={''}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="bg-primary-600 border border-transparent rounded-lg shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  >
                    Envoyer ma demande
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'help' && (
            <div className="prose max-w-none">
              <h3>Centre d'aide</h3>
              <p>
                Un aperçu par thème — chaque page renvoie vers notre centre d'aide complet.
              </p>

              <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    title: 'Premiers pas',
                    description: 'Découvrez comment configurer votre compte et commencer à utiliser ZenFacture.',
                    link: '/aide',
                  },
                  {
                    title: 'Facturation',
                    description: 'Tout ce que vous devez savoir sur la création et la gestion des factures.',
                    link: '/aide',
                  },
                  {
                    title: 'Clients',
                    description: 'Gérez vos clients et leurs informations de facturation.',
                    link: '/aide',
                  },
                  {
                    title: 'Paiements',
                    description: 'Acceptez les paiements en ligne et gérez les paiements reçus.',
                    link: '/aide',
                  },
                  {
                    title: 'Rapports',
                    description: 'Générez des rapports pour suivre votre activité et vos revenus.',
                    link: '/aide',
                  },
                  {
                    title: 'Paramètres',
                    description: 'Personnalisez votre compte et vos paramètres.',
                    link: '/aide',
                  },
                ].map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-4 hover:shadow-card-hover transition-shadow">
                    <h4 className="text-lg font-medium text-gray-900 mb-2">{item.title}</h4>
                    <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                    <a
                      href={item.link}
                      className="text-sm font-medium text-primary-600 hover:text-primary-800"
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
