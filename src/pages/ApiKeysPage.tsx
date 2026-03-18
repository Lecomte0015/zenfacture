import React from 'react';
import { CodeBracketIcon, KeyIcon, PlusIcon } from '@heroicons/react/24/outline';
import ApiKeyManager from '../components/api/ApiKeyManager';

export default function ApiKeysPage() {
  return (
    <div className="space-y-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Clés API
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Gérez vos clés d'API pour l'intégration avec d'autres services
          </p>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Vos clés API
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Créez et gérez les clés pour accéder à l'API ZenFacture
          </p>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          <ApiKeyManager />
        </div>
        
        <div className="px-4 py-4 bg-gray-50 text-right sm:px-6">
          <p className="text-xs text-gray-500">
            Consultez la 
            <a 
              href="/documentation/api" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              documentation de l'API
            </a> pour plus d'informations sur l'intégration.
          </p>
        </div>
      </div>
    </div>
  );
}
