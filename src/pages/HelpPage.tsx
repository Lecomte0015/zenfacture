import React from 'react';
import { FaQuestionCircle, FaEnvelope, FaBook, FaComments } from 'react-icons/fa';

export const HelpPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Centre d'aide
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
          Besoin d'aide ? Nous sommes là pour vous aider.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {/* FAQ */}
        <div className="pt-6">
          <div className="flow-root bg-white px-6 pb-8 rounded-lg shadow h-full">
            <div className="-mt-6">
              <div>
                <span className="inline-flex items-center justify-center p-3 bg-primary-500 rounded-md shadow-lg">
                  <FaQuestionCircle className="h-6 w-6 text-white" aria-hidden="true" />
                </span>
              </div>
              <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">FAQ</h3>
              <p className="mt-5 text-base text-gray-500">
                Consultez notre foire aux questions pour trouver des réponses aux questions les plus courantes.
              </p>
              <div className="mt-6">
                <a href="/faq" className="text-base font-medium text-primary-600 hover:text-primary-500">
                  Voir la FAQ<span aria-hidden="true"> &rarr;</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Documentation */}
        <div className="pt-6">
          <div className="flow-root bg-white px-6 pb-8 rounded-lg shadow h-full">
            <div className="-mt-6">
              <div>
                <span className="inline-flex items-center justify-center p-3 bg-green-500 rounded-md shadow-lg">
                  <FaBook className="h-6 w-6 text-white" aria-hidden="true" />
                </span>
              </div>
              <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Documentation</h3>
              <p className="mt-5 text-base text-gray-500">
                Accédez à notre documentation complète pour des guides détaillés et des tutoriels.
              </p>
              <div className="mt-6">
                <a href="/documentation" className="text-base font-medium text-green-600 hover:text-green-500">
                  Voir la documentation<span aria-hidden="true"> &rarr;</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="pt-6">
          <div className="flow-root bg-white px-6 pb-8 rounded-lg shadow h-full">
            <div className="-mt-6">
              <div>
                <span className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                  <FaEnvelope className="h-6 w-6 text-white" aria-hidden="true" />
                </span>
              </div>
              <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Contactez-nous</h3>
              <p className="mt-5 text-base text-gray-500">
                Notre équipe est là pour vous aider. Contactez-nous pour toute question ou assistance.
              </p>
              <div className="mt-6">
                <a href="mailto:support@zenfacture.com" className="text-base font-medium text-blue-600 hover:text-blue-500">
                  Envoyer un email<span aria-hidden="true"> &rarr;</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900">Questions fréquentes</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Voici les questions les plus fréquemment posées.
          </p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-12 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 sm:col-span-4">Comment créer une facture ?</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-8">
                Pour créer une facture, allez dans le tableau de bord et cliquez sur "Nouvelle facture". Remplissez les détails nécessaires et enregistrez.
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-12 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 sm:col-span-4">Comment modifier mon profil ?</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-8">
                Cliquez sur votre nom en haut à droite, puis sélectionnez "Mon profil" pour modifier vos informations.
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-12 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 sm:col-span-4">Comment exporter mes données ?</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-8">
                Dans le tableau de bord, allez dans les paramètres et sélectionnez "Exporter les données".
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
