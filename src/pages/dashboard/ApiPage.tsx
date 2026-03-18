import React from 'react';
import { Key } from 'lucide-react';

const ApiPage = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">API</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gérez vos clés API et consultez la documentation.
        </p>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Clés API
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Gérez vos clés d'API pour accéder à nos services.
          </p>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Clé API</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <div className="flex items-center">
                <Key className="h-5 w-5 text-gray-400 mr-2" />
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  sk_************************
                </span>
              </div>
            </dd>
          </div>
          
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-t border-gray-200">
            <dt className="text-sm font-medium text-gray-500">Documentation</dt>
            <dd className="mt-1 text-sm text-blue-600 hover:text-blue-500 sm:mt-0 sm:col-span-2">
              <a href="/api-docs" className="hover:underline">
                Voir la documentation de l'API →
              </a>
            </dd>
          </div>
        </div>
      </div>
      
      <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Cette fonctionnalité n'est disponible que pour les abonnements Entreprise.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiPage;
