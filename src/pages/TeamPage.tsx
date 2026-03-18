import { Link } from 'react-router-dom';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import OrganisationManager from '../components/organisation/OrganisationManager';

export default function TeamPage() {
  return (
    <div className="space-y-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Gestion d'équipe
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Gérez les membres de votre équipe et leurs autorisations
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            to="/app/team/invite"
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Inviter un membre
          </Link>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Votre équipe
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Gérez les membres de votre organisation et leurs autorisations
          </p>
        </div>
        <div className="border-t border-gray-200">
          <OrganisationManager />
        </div>
      </div>
    </div>
  );
}
